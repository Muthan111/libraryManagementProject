import { Test, TestingModule } from '@nestjs/testing';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BookService } from '../book/book.service';
import { ChatbotService } from './chatbot.service';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let bookService: { findAll: jest.Mock };

  beforeEach(async () => {
    process.env.GEMINI_API_KEY = 'test-api-key';

    bookService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        {
          provide: BookService,
          useValue: bookService,
        },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns the model text when no tool call is requested', async () => {
    const sendMessage = jest.fn().mockResolvedValue({
      response: {
        candidates: [
          {
            content: {
              parts: [],
            },
          },
        ],
        text: jest.fn().mockReturnValue('Direct Gemini reply'),
      },
    });

    jest.spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel').mockReturnValue({
      startChat: jest.fn().mockReturnValue({
        sendMessage,
      }),
    } as never);

    await expect(service.handleMessage('hello')).resolves.toEqual({
      reply: 'Direct Gemini reply',
    });

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(bookService.findAll).not.toHaveBeenCalled();
  });

  it('uses the books tool and returns the follow-up response', async () => {
    const books = [{ bookid: 1, name: 'Clean Code' }];
    bookService.findAll.mockResolvedValue(books);

    const sendMessage = jest
      .fn()
      .mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    functionCall: {
                      name: 'findAllBooks',
                    },
                  },
                ],
              },
            },
          ],
          text: jest.fn(),
        },
      })
      .mockResolvedValueOnce({
        response: {
          text: jest.fn().mockReturnValue('Here are the books in the library.'),
        },
      });

    jest.spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel').mockReturnValue({
      startChat: jest.fn().mockReturnValue({
        sendMessage,
      }),
    } as never);

    await expect(service.handleMessage('what books do you have?')).resolves.toEqual({
      reply: 'Here are the books in the library.',
    });

    expect(bookService.findAll).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenNthCalledWith(
      2,
      expect.arrayContaining([
        expect.objectContaining({
          functionResponse: {
            name: 'findAllBooks',
            response: {
              books,
            },
          },
        }),
      ]),
    );
  });

  it('falls back to the model text when a different tool call is requested', async () => {
    const sendMessage = jest.fn().mockResolvedValue({
      response: {
        candidates: [
          {
            content: {
              parts: [
                {
                  functionCall: {
                    name: 'unsupportedTool',
                  },
                },
              ],
            },
          },
        ],
        text: jest.fn().mockReturnValue('Fallback reply'),
      },
    });

    jest.spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel').mockReturnValue({
      startChat: jest.fn().mockReturnValue({
        sendMessage,
      }),
    } as never);

    await expect(service.handleMessage('do something else')).resolves.toEqual({
      reply: 'Fallback reply',
    });
    expect(bookService.findAll).not.toHaveBeenCalled();
  });
});
