import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { BookService } from '../book/book.service';
import { Book } from '../book/book.entity';
@Injectable()
export class ChatbotService {
  private readonly genAI: GoogleGenerativeAI;
  // Injects book data access and initializes the Gemini client.
  constructor(private readonly bookService: BookService) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  // Handles a chat request and fulfills tool calls when the model asks for book data.
  async handleMessage(message: string) {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',

      tools: [
        {
          functionDeclarations: [
            {
              name: 'findAllBooks',
              description: 'Get all books from the library',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {},
              },
            },
            {
              name: 'findBookByName',
              description: 'Find a book by its name',
              parameters: {
                type: SchemaType.OBJECT,
                properties: {
                  name: {
                    type: SchemaType.STRING,
                    description: 'Name of the book',
                  },
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
                  ISBN: {
                    type: SchemaType.STRING,
                    description: 'ISBN of the book',
                  },
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
                  author: {
                    type: SchemaType.STRING,
                    description: 'Author name',
                  },
                },
                required: ['author'],
              },
            },
          ],
        },
      ],
    });

    const chat = model.startChat();

    const result = await chat.sendMessage(`
    You are a helpful library assistant.

    When users ask about books,
    ALWAYS use available tools.

    User message:
    ${message}
  `);

    const response = result.response;

    const toolCall = response.candidates?.[0]?.content?.parts?.find(
      (part) => part.functionCall,
    )?.functionCall;

    if (toolCall) {
      type ToolResult = Book | Book[] | null;

      const getStringArg = (args: unknown, key: string): string | undefined => {
        if (!args || typeof args !== 'object') return undefined;
        const val = (args as Record<string, unknown>)[key];
        return typeof val === 'string' ? val : undefined;
      };

      let toolResult: ToolResult | undefined;

      switch (toolCall.name) {
        case 'findAllBooks': {
          toolResult = await this.bookService.findAll();
          break;
        }

        case 'findBookByName': {
          const name = getStringArg(toolCall.args, 'name');
          if (!name) {
            throw new Error(
              "Missing or invalid argument 'ISBN' for " + toolCall.name,
            );
          }
          toolResult = await this.bookService.findBookByName(name);
          break;
        }

        case 'findBookByISBN': {
          const isbn = getStringArg(toolCall.args, 'ISBN');
          if (!isbn) {
            throw new Error(
              "Missing or invalid argument 'ISBN' for " + toolCall.name,
            );
          }
          toolResult = await this.bookService.findBookByISBN(isbn);
          break;
        }

        case 'findBookByAuthor': {
          const author = getStringArg(toolCall.args, 'author');
          if (!author) {
            throw new Error(
              "Missing or invalid argument 'author' for " + toolCall.name,
            );
          }
          toolResult = await this.bookService.findBookByAuthor(author);
          break;
        }

        default:
          throw new Error(`Unknown tool: ${toolCall.name}`);
      }

      const secondResult = await chat.sendMessage([
        {
          functionResponse: {
            name: toolCall.name,
            response: {
              result: toolResult,
            },
          },
        },
      ]);

      return {
        reply: secondResult.response.text(),
      };
    }

    return {
      reply: response.text(),
    };
  }
}
