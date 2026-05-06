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
    });

    await expect(controller.chat({ message: 'hello' })).resolves.toEqual({
      reply: 'Hello from the bot',
    });

    expect(chatbotService.handleMessage).toHaveBeenCalledWith('hello');
  });
});
