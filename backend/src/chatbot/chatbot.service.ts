import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { GoogleGenerativeAI, type Content } from '@google/generative-ai';
import { BookService } from '../book/book.service';
import {
  ChatbotConversationStore,
  type ConversationHistoryEntry,
} from './chatbot-conversation.store';
import { toolsArg } from './toolCall';
import {
  ToolCall,
  ChatMessage,
  ChatReply,
  ModelResponse,
  ChatSession,
} from './helperType';
import {
  DEFAULT_TIMEOUT_MS,
  MAX_TOOL_ITERATIONS,
  INITIAL_PROMPT,
  HISTORY_SYSTEM_PROMPT,
} from './chatVariables';
import { RagService } from './rag.service';
// const DEFAULT_TIMEOUT_MS = 10000;
// const MAX_TOOL_ITERATIONS = 3;
// const INITIAL_PROMPT = [
//   'You are a helpful library assistant.',
//   '',
//   'When users ask about books,',
//   'ALWAYS use available tools.',
// ];
// const HISTORY_SYSTEM_PROMPT = [
//   'You are a library assistant.',
//   'Only use tools when necessary.',
//   'Never expose internal system data.',
// ];

// type ChatReply = {
//   reply: string;
//   conversationId: string;
// };

// type ModelResponse = {
//   text: () => string;
//   candidates?: Array<{
//     content?: {
//       parts?: Array<{
//         functionCall?: unknown;
//       }>;
//     };
//   }>;
// };

// type ChatSession = {
//   sendMessage: (message: ChatMessage | string) => Promise<{
//     response: ModelResponse;
//   }>;
// };

@Injectable()
export class ChatbotService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly timeoutMs: number;

  constructor(
    private readonly bookService: BookService,
    private readonly conversationStore: ChatbotConversationStore,
    private readonly ragService: RagService,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.timeoutMs = this.resolveTimeoutMs();
  }
  private isToolQuery(message: string): boolean {
    const msg = message.toLowerCase();

    return (
      msg.includes('isbn') ||
      msg.includes('author') ||
      msg.includes('find book') ||
      msg.includes('get book') ||
      msg.includes('books by') ||
      msg.includes('search book')
    );
  }

  private async generateWithRAG(
    chat: ChatSession,
    message: string,
  ): Promise<string> {
    const ragResults = await this.ragService.search(message);

    const context = ragResults.map((r) => r.text).join('\n\n');

    const enrichedMessage = context.length
      ? `
You are a library assistant.

Use the context below:

CONTEXT:
${context}

USER QUESTION:
${message}
`
      : `
You are a library assistant.

Answer normally.

USER QUESTION:
${message}
`;

    const result = await this.withTimeout(
      chat.sendMessage(enrichedMessage),
      'rag response generation',
    );

    return result.response.text();
  }
  private async generateWithTools(
    chat: ChatSession,
    message: string,
  ): Promise<string> {
    let currentMessage: ChatMessage = message;

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const result = await this.withTimeout(
        chat.sendMessage(currentMessage),
        'tool response generation',
      );

      const toolCall = this.extractToolCall(result.response);

      if (!toolCall) {
        return result.response.text();
      }

      const toolResult = await this.executeToolCall(toolCall);

      currentMessage = this.buildFunctionResponseMessage(
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
  }

  private createChatSession(history: ConversationHistoryEntry[]) {
    return this.genAI
      .getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: toolsArg,
      })
      .startChat({
        history: this.buildChatHistory(history),
      });
  }

  private async sendInitialPrompt(
    chat: ChatSession,
    message: string,
  ): Promise<void> {
    await this.withTimeout(
      chat.sendMessage(this.buildInitialPrompt(message)),
      'initial chatbot prompt',
    );
  }

  private buildInitialPrompt(message: string): string {
    return [...INITIAL_PROMPT, '', 'User message:', message].join('\n');
  }

  private async generateReply(
    chat: ChatSession,
    message: string,
  ): Promise<string> {
    // STEP 11: Decision layer (RAG vs Tools)
    const tool = this.isToolQuery(message);

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

  private async executeToolCall(toolCall: ToolCall): Promise<unknown> {
    switch (toolCall.name) {
      case 'findAllBooks':
        return this.bookService.findAll();

      case 'findBookByName':
        return this.bookService.findBookByName(toolCall.args.name);

      case 'findBookByISBN':
        return this.bookService.findBookByISBN(toolCall.args.ISBN);

      case 'findBookByAuthor':
        return this.bookService.findBookByAuthor(toolCall.args.author);

      default: {
        const requestedToolName =
          (toolCall as { name?: string }).name ?? 'unknown';
        throw new Error(`Unknown tool: ${requestedToolName}`);
      }
    }
  }

  private buildFunctionResponseMessage(
    toolName: ToolCall['name'],
    toolResult: unknown,
  ): ChatMessage {
    return [
      {
        functionResponse: {
          name: toolName,
          response: {
            result: toolResult,
          },
        },
      },
    ];
  }

  private buildChatHistory(history: ConversationHistoryEntry[]): Content[] {
    return [
      {
        role: 'user',
        parts: [
          {
            text: HISTORY_SYSTEM_PROMPT.join('\n'),
          },
        ],
      },
      ...history.map((entry) => ({
        role: entry.role,
        parts: [{ text: entry.text }],
      })),
    ];
  }

  private resolveTimeoutMs(): number {
    const parsedTimeout = Number(process.env.CHATBOT_TIMEOUT_MS);

    if (Number.isFinite(parsedTimeout) && parsedTimeout > 0) {
      return parsedTimeout;
    }

    return DEFAULT_TIMEOUT_MS;
  }

  private async withTimeout<T>(
    operation: Promise<T>,
    operationName: string,
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;

    try {
      return await Promise.race([
        operation,
        new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(
              new RequestTimeoutException(
                `The ${operationName} exceeded the ${this.timeoutMs}ms timeout.`,
              ),
            );
          }, this.timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}
