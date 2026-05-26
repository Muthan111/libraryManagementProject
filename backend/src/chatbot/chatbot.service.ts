import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';
import { BookService } from '../book/book.service';
import {
  ChatbotConversationStore,
  type ConversationHistoryEntry,
} from './chatbot-conversation.store';
import {
  ChatMessage,
  ChatReply,
  ChatSession,
  ModelResponse,
  ToolCall,
} from './helperType';
import { PromptBuilder } from './prompt-builder';
import { RagService } from './rag.service';
import { RoutingPolicy } from './routing-policy';
import { ChatSessionFactory } from './chat-session.factory';
import { TimeoutService } from './timeout.service';
import { ToolExecutor } from './tool-executor';
import { DEFAULT_TIMEOUT_MS, MAX_TOOL_ITERATIONS } from './chatVariables';

@Injectable()
export class ChatbotService {
  private readonly timeoutMs: number;

  constructor(
    private readonly bookService: BookService,
    private readonly conversationStore: ChatbotConversationStore,
    private readonly ragService: RagService,
    private readonly sessionFactory: ChatSessionFactory,
    private readonly toolExecutor: ToolExecutor,
    private readonly promptBuilder: PromptBuilder,
    private readonly routingPolicy: RoutingPolicy,
    private readonly timeoutService: TimeoutService,
    @InjectMetric('chatbot_requests_total')
    private readonly chatbotRequestsCounter: Counter<string>,
    @InjectMetric('chatbot_response_duration_seconds')
    private readonly chatbotResponseDuration: Histogram<string>,
    @InjectMetric('memory_usage_bytes')
    private readonly memoryUsageGauge: Gauge<string>,
    @InjectMetric('cpu_usage_percent')
    private readonly cpuUsageGauge: Gauge<string>,
  ) {
    this.timeoutMs = this.resolveTimeoutMs();
  }

  private async generateWithRAG(
    chat: ChatSession,
    message: string,
  ): Promise<string> {
    const ragResults = await this.ragService.search(message);
    const context = ragResults.map((result) => result.text).join('\n\n');
    const enrichedMessage = this.promptBuilder.buildRagEnrichedMessage(
      context,
      message,
    );

    const result = await this.timeoutService.withTimeout(
      chat.sendMessage(enrichedMessage),
      this.timeoutMs,
      'rag response generation',
    );

    console.log('RAG RESULTS:', ragResults);
    return result.response.text();
  }

  private async generateWithTools(
    chat: ChatSession,
    message: string,
  ): Promise<string> {
    let currentMessage: ChatMessage = message;

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i += 1) {
      const result = await this.timeoutService.withTimeout(
        chat.sendMessage(currentMessage),
        this.timeoutMs,
        'tool response generation',
      );

      const toolCall = this.extractToolCall(result.response);

      if (!toolCall) {
        return result.response.text();
      }

      const toolResult = await this.toolExecutor.run(toolCall);
      currentMessage = this.toolExecutor.buildFunctionResponseMessage(
        toolCall.name,
        toolResult,
      );
    }

    return 'No final response generated.';
  }

  async handleMessage(
    message: string,
    conversationId?: string,
  ): Promise<ChatReply> {
    this.chatbotRequestsCounter.inc();
    const endTimer = this.chatbotResponseDuration.startTimer();
    const startCpuUsage = process.cpuUsage();
    const startTime = process.hrtime.bigint();

    try {
      const resolvedConversationId =
        await this.conversationStore.getOrCreateConversationId(conversationId);
      const history = await this.conversationStore.loadHistory(
        resolvedConversationId,
      );
      const chat = this.createChatSession(history);

      await this.sendInitialPrompt(chat, message);

      const reply = await this.generateReply(chat, message);
      await this.conversationStore.appendTurn(
        resolvedConversationId,
        message,
        reply,
      );

      return {
        reply,
        conversationId: resolvedConversationId,
      };
    } finally {
      endTimer();
      this.recordSystemMetrics(startCpuUsage, startTime);
    }
  }

  private createChatSession(history: ConversationHistoryEntry[]) {
    const built = this.promptBuilder.buildChatHistory(history);
    return this.sessionFactory.create(built);
  }

  private async sendInitialPrompt(
    chat: ChatSession,
    message: string,
  ): Promise<void> {
    await this.timeoutService.withTimeout(
      chat.sendMessage(this.promptBuilder.buildInitialPrompt(message)),
      this.timeoutMs,
      'initial chatbot prompt',
    );
  }

  private async generateReply(
    chat: ChatSession,
    message: string,
  ): Promise<string> {
    const tool = this.routingPolicy.isToolQuery(message);

    if (tool && message.length < 80) {
      return this.generateWithTools(chat, message);
    }

    return this.generateWithRAG(chat, message);
  }

  private extractToolCall(response: ModelResponse): ToolCall | null {
    const extractedToolCall = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.functionCall,
    )?.functionCall;

    if (!extractedToolCall) {
      return null;
    }

    return extractedToolCall as ToolCall;
  }

  private resolveTimeoutMs(): number {
    const parsedTimeout = Number(process.env.CHATBOT_TIMEOUT_MS);

    if (Number.isFinite(parsedTimeout) && parsedTimeout > 0) {
      return parsedTimeout;
    }

    return DEFAULT_TIMEOUT_MS;
  }

  private recordSystemMetrics(
    startCpuUsage: NodeJS.CpuUsage,
    startTime: bigint,
  ) {
    const cpuUsage = process.cpuUsage(startCpuUsage);
    const elapsedMicroseconds =
      Number(process.hrtime.bigint() - startTime) / 1_000;
    const cpuMicroseconds = cpuUsage.user + cpuUsage.system;

    this.memoryUsageGauge.set(process.memoryUsage().heapUsed);
    this.cpuUsageGauge.set(
      elapsedMicroseconds > 0
        ? (cpuMicroseconds / elapsedMicroseconds) * 100
        : 0,
    );
  }
}
