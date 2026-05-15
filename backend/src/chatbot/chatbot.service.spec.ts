import { Test, TestingModule } from '@nestjs/testing';
import { RequestTimeoutException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BookService } from '../book/book.service';
import { ChatbotService } from './chatbot.service';
import { ChatbotConversationStore } from './chatbot-conversation.store';

jest.mock(
  'src/utils/code-generator',
  () => ({
    generateCode: jest.fn(() => 'BK-ABCD-1234'),
  }),
  { virtual: true },
);

describe('ChatbotService', () => {
  let service: ChatbotService;
  let bookService: {
    findAll: jest.Mock;
    findBookByName: jest.Mock;
    findBookByISBN: jest.Mock;
    findBookByAuthor: jest.Mock;
  };
  let conversationStore: {
    getOrCreateConversationId: jest.Mock;
    loadHistory: jest.Mock;
    appendTurn: jest.Mock;
  };
  const originalTimeout = process.env.CHATBOT_TIMEOUT_MS;

  beforeEach(async () => {
    process.env.GEMINI_API_KEY = 'test-api-key';
    delete process.env.CHATBOT_TIMEOUT_MS;

    bookService = {
      findAll: jest.fn(),
      findBookByName: jest.fn(),
      findBookByISBN: jest.fn(),
      findBookByAuthor: jest.fn(),
    };
    conversationStore = {
      getOrCreateConversationId: jest.fn().mockResolvedValue('conversation-1'),
      loadHistory: jest.fn().mockResolvedValue([]),
      appendTurn: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        {
          provide: BookService,
          useValue: bookService,
        },
        {
          provide: ChatbotConversationStore,
          useValue: conversationStore,
        },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();

    if (originalTimeout === undefined) {
      delete process.env.CHATBOT_TIMEOUT_MS;
    } else {
      process.env.CHATBOT_TIMEOUT_MS = originalTimeout;
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns the model text when no tool call is requested', async () => {
    const sendMessage = jest
      .fn()
      .mockResolvedValueOnce({
        response: {
          text: jest.fn(),
        },
      })
      .mockResolvedValueOnce({
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
      conversationId: 'conversation-1',
    });

    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(bookService.findAll).not.toHaveBeenCalled();
    expect(conversationStore.appendTurn).toHaveBeenCalledWith(
      'conversation-1',
      'hello',
      'Direct Gemini reply',
    );
  });

  it('uses the books tool and returns the follow-up response', async () => {
    const books = {
      data: [{ bookid: 1, name: 'Clean Code' }],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    };
    bookService.findAll.mockResolvedValue(books);

    const sendMessage = jest
      .fn()
      .mockResolvedValueOnce({
        response: {
          text: jest.fn(),
        },
      })
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
      conversationId: 'conversation-1',
    });

    expect(bookService.findAll).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenNthCalledWith(
      3,
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
    expect(conversationStore.appendTurn).toHaveBeenCalledWith(
      'conversation-1',
      'what books do you have?',
      'Here are the books in the library.',
    );
  });

  it('uses the findBookByName tool and returns the follow-up response', async () => {
    const book = { bookid: 2, name: 'The Pragmatic Programmer' };
    bookService.findBookByName.mockResolvedValue(book);

    const sendMessage = jest
      .fn()
      .mockResolvedValueOnce({
        response: {
          text: jest.fn(),
        },
      })
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
      conversationId: 'conversation-1',
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
          text: jest.fn(),
        },
      })
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
      conversationId: 'conversation-1',
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
          text: jest.fn(),
        },
      })
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
      conversationId: 'conversation-1',
    });

    expect(bookService.findBookByAuthor).toHaveBeenCalledWith(
      'Robert C. Martin',
    );
  });

  it('throws when a different tool call is requested', async () => {
    const sendMessage = jest
      .fn()
      .mockResolvedValueOnce({
        response: {
          text: jest.fn(),
        },
      })
      .mockResolvedValueOnce({
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

  it('times out when Gemini does not respond in time', async () => {
    jest.useFakeTimers();
    process.env.CHATBOT_TIMEOUT_MS = '5';

    const hangingPromise = new Promise(() => undefined);
    const sendMessage = jest.fn().mockReturnValue(hangingPromise);

    jest
      .spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel')
      .mockReturnValue({
        startChat: jest.fn().mockReturnValue({
          sendMessage,
        }),
      } as never);

    const timeoutModule: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        {
          provide: BookService,
          useValue: bookService,
        },
        {
          provide: ChatbotConversationStore,
          useValue: conversationStore,
        },
      ],
    }).compile();

    const timeoutService = timeoutModule.get<ChatbotService>(ChatbotService);
    const pendingReply = timeoutService.handleMessage('hello');
    const timeoutExpectation = expect(pendingReply).rejects.toMatchObject({
      message: 'The initial chatbot prompt exceeded the 5ms timeout.',
    });

    await jest.advanceTimersByTimeAsync(5);

    await timeoutExpectation;
    await expect(pendingReply).rejects.toBeInstanceOf(RequestTimeoutException);
  });

  it('replays stored history before sending the next message', async () => {
    conversationStore.loadHistory.mockResolvedValue([
      { role: 'user', text: 'Hi there' },
      { role: 'model', text: 'Hello, how can I help?' },
    ]);

    const startChat = jest.fn().mockReturnValue({
      sendMessage: jest
        .fn()
        .mockResolvedValueOnce({
          response: {
            text: jest.fn(),
          },
        })
        .mockResolvedValueOnce({
          response: {
            candidates: [
              {
                content: {
                  parts: [],
                },
              },
            ],
            text: jest.fn().mockReturnValue('Welcome back'),
          },
        }),
    });

    jest
      .spyOn(GoogleGenerativeAI.prototype, 'getGenerativeModel')
      .mockReturnValue({
        startChat,
      } as never);

    await expect(
      service.handleMessage('Continue our chat', 'conversation-77'),
    ).resolves.toEqual({
      reply: 'Welcome back',
      conversationId: 'conversation-1',
    });

    expect(conversationStore.getOrCreateConversationId).toHaveBeenCalledWith(
      'conversation-77',
    );
    expect(startChat).toHaveBeenCalledWith({
      history: expect.arrayContaining([
        expect.objectContaining({
          role: 'user',
          parts: [{ text: 'Hi there' }],
        }),
        expect.objectContaining({
          role: 'model',
          parts: [{ text: 'Hello, how can I help?' }],
        }),
      ]),
    });
  });
});
