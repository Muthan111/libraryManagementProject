import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { BookModule } from 'src/book/book.module';
import { ChatbotConversationStore } from './chatbot-conversation.store';
import { RagService } from './rag.service';
@Module({
  imports: [BookModule],

  providers: [ChatbotService, ChatbotConversationStore, RagService],
  controllers: [ChatbotController],
})
export class ChatbotModule {}
