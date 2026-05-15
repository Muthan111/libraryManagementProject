import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatRequestDto } from './dto/chat-request.dto';
@Controller('chat')
export class ChatbotController {
  // Injects chatbot logic for handling conversational requests.
  constructor(private readonly chatbotService: ChatbotService) {}

  @ApiOperation({ summary: 'Chat with the bot' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        conversationId: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Chatbot reply generated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  // Sends the user's message to the chatbot service and returns its reply.
  @Post()
  async chat(@Body() body: ChatRequestDto) {
    return this.chatbotService.handleMessage(body.message, body.conversationId);
  }
}
