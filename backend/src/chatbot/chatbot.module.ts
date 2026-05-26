import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { BookModule } from 'src/book/book.module';
import { ChatbotConversationStore } from './chatbot-conversation.store';
import { RagService } from './rag.service';
import { ChatSessionFactory } from './chat-session.factory';
import { ToolExecutor } from './tool-executor';
import { PromptBuilder } from './prompt-builder';
import { RoutingPolicy } from './routing-policy';
import { TimeoutService } from './timeout.service';
import { RagController } from './rag.seed.controller';
import { RagSeeder } from './rag.seed';
import { MetricsModule } from '../metrics/metrics.module';
@Module({
  imports: [BookModule, MetricsModule],

  providers: [
    ChatbotService,
    ChatbotConversationStore,
    RagService,
    ChatSessionFactory,
    ToolExecutor,
    PromptBuilder,
    RoutingPolicy,
    TimeoutService,
    RagSeeder,
  ],
  controllers: [ChatbotController, RagController],
})
export class ChatbotModule {}
