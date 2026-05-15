import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';

describe('ChatbotController', () => {
  let controller: ChatbotController;
  let chatbotService: { handleMessage: jest.Mock };

  beforeEach(async () => {
    chatbotService = {
      handleMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatbotController],
      providers: [
        {
          provide: ChatbotService,
          useValue: chatbotService,
        },
      ],
    }).compile();

    controller = module.get<ChatbotController>(ChatbotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes the incoming message to the chatbot service', async () => {
    chatbotService.handleMessage.mockResolvedValue({
      reply: 'Hello from the bot',
      conversationId: 'conversation-1',
    });

    await expect(
      controller.chat({ message: 'hello', conversationId: 'conversation-1' }),
    ).resolves.toEqual({
      reply: 'Hello from the bot',
      conversationId: 'conversation-1',
    });

    expect(chatbotService.handleMessage).toHaveBeenCalledWith(
      'hello',
      'conversation-1',
    );
  });

  it('forwards an empty message string unchanged', async () => {
    chatbotService.handleMessage.mockResolvedValue({
      reply: 'Please ask a question.',
      conversationId: 'conversation-2',
    });

    await expect(controller.chat({ message: '' })).resolves.toEqual({
      reply: 'Please ask a question.',
      conversationId: 'conversation-2',
    });
    expect(chatbotService.handleMessage).toHaveBeenCalledWith('', undefined);
  });
});
