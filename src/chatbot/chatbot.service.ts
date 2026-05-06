import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI,SchemaType } from '@google/generative-ai';
import { BookService } from '../book/book.service';
@Injectable()
export class ChatbotService {
  private readonly genAI: GoogleGenerativeAI;
  constructor(
  private readonly bookService: BookService,
  
) {this.genAI = new GoogleGenerativeAI(
      process.env.GEMINI_API_KEY!,
    );}

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

  const toolCall =
    response.candidates?.[0]?.content?.parts?.find(
      (part) => part.functionCall,
    )?.functionCall;

  if (toolCall?.name === 'findAllBooks') {

    const books = await this.bookService.findAll();

    const secondResult = await chat.sendMessage([
      {
        functionResponse: {
          name: 'findAllBooks',
          response: {
            books,
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
