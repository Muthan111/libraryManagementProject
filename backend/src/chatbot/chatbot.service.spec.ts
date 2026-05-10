import { Test, TestingModule } from '@nestjs/testing';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BookService } from '../book/book.service';
import { ChatbotService } from './chatbot.service';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let bookService: {
    findAll: jest.Mock;
    findBookByName: jest.Mock;
    findBookByISBN: jest.Mock;
    findBookByAuthor: jest.Mock;
  };

  beforeEach(async () => {
    process.env.GEMINI_API_KEY = 'test-api-key';

    bookService = {
      findAll: jest.fn(),
      findBookByName: jest.fn(),
      findBookByISBN: jest.fn(),
      findBookByAuthor: jest.fn(),
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

    jest
      .spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel')
      .mockReturnValue({
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

    jest
      .spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel')
      .mockReturnValue({
        startChat: jest.fn().mockReturnValue({
          sendMessage,
        }),
      } as never);

    await expect(
      service.handleMessage('what books do you have?'),
    ).resolves.toEqual({
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
              result: books,
            },
          },
        }),
      ]),
    );
  });

  it('uses the findBookByName tool and returns the follow-up response', async () => {
    const book = { bookid: 2, name: 'The Pragmatic Programmer' };
    bookService.findBookByName.mockResolvedValue(book);

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
                      name: 'findBookByName',
                      args: { name: 'The Pragmatic Programmer' },
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
          text: jest.fn().mockReturnValue('I found that book for you.'),
        },
      });

    jest
      .spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel')
      .mockReturnValue({
        startChat: jest.fn().mockReturnValue({
          sendMessage,
        }),
      } as never);

    await expect(
      service.handleMessage('find The Pragmatic Programmer'),
    ).resolves.toEqual({
      reply: 'I found that book for you.',
    });

    expect(bookService.findBookByName).toHaveBeenCalledWith(
      'The Pragmatic Programmer',
    );
  });

  it('uses the findBookByISBN tool and returns the follow-up response', async () => {
    const book = { bookid: 3, ISBN: '9780135957059' };
    bookService.findBookByISBN.mockResolvedValue(book);

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
                      name: 'findBookByISBN',
                      args: { ISBN: '9780135957059' },
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
          text: jest.fn().mockReturnValue('Here is the book with that ISBN.'),
        },
      });

    jest
      .spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel')
      .mockReturnValue({
        startChat: jest.fn().mockReturnValue({
          sendMessage,
        }),
      } as never);

    await expect(
      service.handleMessage('find ISBN 9780135957059'),
    ).resolves.toEqual({
      reply: 'Here is the book with that ISBN.',
    });

    expect(bookService.findBookByISBN).toHaveBeenCalledWith('9780135957059');
  });

  it('uses the findBookByAuthor tool and returns the follow-up response', async () => {
    const book = { bookid: 4, Author: 'Robert C. Martin' };
    bookService.findBookByAuthor.mockResolvedValue(book);

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
                      name: 'findBookByAuthor',
                      args: { author: 'Robert C. Martin' },
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
          text: jest.fn().mockReturnValue('These books match that author.'),
        },
      });

    jest
      .spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel')
      .mockReturnValue({
        startChat: jest.fn().mockReturnValue({
          sendMessage,
        }),
      } as never);

    await expect(
      service.handleMessage('find books by Robert C. Martin'),
    ).resolves.toEqual({
      reply: 'These books match that author.',
    });

    expect(bookService.findBookByAuthor).toHaveBeenCalledWith(
      'Robert C. Martin',
    );
  });

  it('throws when a different tool call is requested', async () => {
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

    jest
      .spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel')
      .mockReturnValue({
        startChat: jest.fn().mockReturnValue({
          sendMessage,
        }),
      } as never);

    await expect(service.handleMessage('do something else')).rejects.toThrow(
      'Unknown tool: unsupportedTool',
    );
    expect(bookService.findAll).not.toHaveBeenCalled();
  });
});
