import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { BookModule } from 'src/book/book.module';
import { ChatbotConversationStore } from './chatbot-conversation.store';

@Module({
  imports: [BookModule],

  providers: [ChatbotService, ChatbotConversationStore],
  controllers: [ChatbotController],
})
export class ChatbotModule {}
