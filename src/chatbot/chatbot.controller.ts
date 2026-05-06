import { Controller, Post, Body } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
@Controller('chat')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @ApiOperation({ summary: 'Chat with the bot' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        
      },
    },
  })
  @Post()
  async chat(@Body() body: { message: string }) {
    return this.chatbotService.handleMessage(body.message);
  }
}