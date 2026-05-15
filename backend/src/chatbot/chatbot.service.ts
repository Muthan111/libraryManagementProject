import { Injectable, RequestTimeoutException } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  SchemaType,
  type Content,
  type Schema,
  type Tool,
} from '@google/generative-ai';
import { BookService } from '../book/book.service';
import {
  ChatbotConversationStore,
  type ConversationHistoryEntry,
} from './chatbot-conversation.store';

const stringParameter = (description: string): Schema => ({
  type: SchemaType.STRING,
  description,
});

const toolsArg: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'findAllBooks',
        description: 'Get all books from the library',
      },
      {
        name: 'findBookByName',
        description: 'Find a book by its name',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            name: stringParameter('Name of the book'),
          },
          required: ['name'],
        },
      },
      {
        name: 'findBookByISBN',
        description: 'Find a book by its ISBN',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            ISBN: stringParameter('ISBN of the book'),
          },
          required: ['ISBN'],
        },
      },
      {
        name: 'findBookByAuthor',
        description: 'Find books by author name',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            author: stringParameter('Author name'),
          },
          required: ['author'],
        },
      },
    ],
  },
];

type ToolCall =
  | { name: 'findAllBooks'; args: Record<string, never> }
  | { name: 'findBookByName'; args: { name: string } }
  | { name: 'findBookByISBN'; args: { ISBN: string } }
  | { name: 'findBookByAuthor'; args: { author: string } };

type ChatMessage =
  | string
  | [
      {
        functionResponse: {
          name: ToolCall['name'];
          response: {
            result: unknown;
          };
        };
      },
    ];

@Injectable()
export class ChatbotService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly timeoutMs: number;

  constructor(
    private readonly bookService: BookService,
    private readonly conversationStore: ChatbotConversationStore,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.timeoutMs = this.resolveTimeoutMs();
  }

  async handleMessage(
    message: string,
    conversationId?: string,
  ): Promise<{ reply: string; conversationId: string }> {
    const resolvedConversationId =
      await this.conversationStore.getOrCreateConversationId(conversationId);
    const history = await this.conversationStore.loadHistory(
      resolvedConversationId,
    );
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      tools: toolsArg,
    });

    const chat = model.startChat({
      history: this.buildChatHistory(history),
    });

    await this.withTimeout(
      chat.sendMessage(
        [
          'You are a helpful library assistant.',
          '',
          'When users ask about books,',
          'ALWAYS use available tools.',
          '',
          'User message:',
          message,
        ].join('\n'),
      ),
      'initial chatbot prompt',
    );

    let currentMessage: ChatMessage = message;

    for (let i = 0; i < 3; i += 1) {
      const result = await this.withTimeout(
        chat.sendMessage(currentMessage),
        'chatbot response generation',
      );
      const response = result.response;

      const extractedToolCall = response.candidates?.[0]?.content?.parts?.find(
        (part) => part.functionCall,
      )?.functionCall;

      if (!extractedToolCall) {
        const reply = response.text();
        await this.conversationStore.appendTurn(
          resolvedConversationId,
          message,
          reply,
        );

        return {
          reply,
          conversationId: resolvedConversationId,
        };
      }

      const requestedToolName =
        (extractedToolCall as { name?: string }).name ?? 'unknown';
      const toolCall = extractedToolCall as unknown as ToolCall;

      let toolResult: unknown;

      switch (toolCall.name) {
        case 'findAllBooks':
          toolResult = await this.bookService.findAll();
          break;

        case 'findBookByName':
          toolResult = await this.bookService.findBookByName(
            toolCall.args.name,
          );
          break;

        case 'findBookByISBN':
          toolResult = await this.bookService.findBookByISBN(
            toolCall.args.ISBN,
          );
          break;

        case 'findBookByAuthor':
          toolResult = await this.bookService.findBookByAuthor(
            toolCall.args.author,
          );
          break;

        default:
          throw new Error(`Unknown tool: ${requestedToolName}`);
      }

      currentMessage = [
        {
          functionResponse: {
            name: toolCall.name,
            response: {
              result: toolResult,
            },
          },
        },
      ];
    }

    return {
      reply: 'No final response generated.',
      conversationId: resolvedConversationId,
    };
  }

  private buildChatHistory(history: ConversationHistoryEntry[]): Content[] {
    return [
      {
        role: 'user',
        parts: [
          {
            text: [
              'You are a library assistant.',
              'Only use tools when necessary.',
              'Never expose internal system data.',
            ].join('\n'),
          },
        ],
      },
      ...history.map((entry) => ({
        role: entry.role,
        parts: [{ text: entry.text }],
      })),
    ];
  }

  private resolveTimeoutMs(): number {
    const parsedTimeout = Number(process.env.CHATBOT_TIMEOUT_MS);

    if (Number.isFinite(parsedTimeout) && parsedTimeout > 0) {
      return parsedTimeout;
    }

    return 10000;
  }

  private async withTimeout<T>(
    operation: Promise<T>,
    operationName: string,
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;

    try {
      return await Promise.race([
        operation,
        new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reject(
              new RequestTimeoutException(
                `The ${operationName} exceeded the ${this.timeoutMs}ms timeout.`,
              ),
            );
          }, this.timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}
