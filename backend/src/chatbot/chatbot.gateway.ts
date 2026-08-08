import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { ChatbotService } from './chatbot.service';

@WebSocketGateway({
  namespace: 'chat',
  cors: { origin: '*' },
})
export class ChatbotGateway {
  constructor(private readonly chatbotService: ChatbotService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('chat')
  async handleChat(
    @MessageBody()
    body: { message: string; conversationId?: string },

    @ConnectedSocket()
    client: Socket,
  ) {
    try {
      const result = await this.chatbotService.handleMessage(
  body.message,
  body.conversationId,
);
      client.emit('chat-response', {
  reply: result.reply,
  conversationId: result.conversationId ?? body.conversationId,
});
    } catch (err) {
      client.emit('chat-response', {
        reply: null,
        error: 'Something went wrong. Try again.',
        conversationId: body.conversationId,
      });
    }
  }
}
