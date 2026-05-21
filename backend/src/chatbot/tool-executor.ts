import { Injectable } from '@nestjs/common';
import { BookService } from '../book/book.service';
import { ToolCall, ChatMessage } from './helperType';

@Injectable()
export class ToolExecutor {
  constructor(private readonly bookService: BookService) {}

  async run(toolCall: ToolCall): Promise<unknown> {
    switch (toolCall.name) {
      case 'findAllBooks':
        return this.bookService.findAll();

      case 'findBookByName':
        return this.bookService.findBookByName(toolCall.args.name);

      case 'findBookByISBN':
        return this.bookService.findBookByISBN(toolCall.args.ISBN);

      case 'findBookByAuthor':
        return this.bookService.findBookByAuthor(toolCall.args.author);

      default: {
        const requestedToolName =
          (toolCall as { name?: string }).name ?? 'unknown';
        throw new Error(`Unknown tool: ${requestedToolName}`);
      }
    }
  }

  buildFunctionResponseMessage(
    toolName: ToolCall['name'],
    toolResult: unknown,
  ): ChatMessage {
    return [
      {
        functionResponse: {
          name: toolName,
          response: {
            result: toolResult,
          },
        },
      },
    ];
  }
}
