import { Injectable } from '@nestjs/common';
import { RagService } from './rag.service';
import { BookService } from 'src/book/book.service';

@Injectable()
export class RagSeeder {
  constructor(
    private readonly ragService: RagService,
    private readonly bookService: BookService,
  ) {}

  async indexAllBooks() {
    const result = await this.bookService.findAll();
    const books = result?.data ?? [];

    for (const book of books) {
      await this.ragService.indexBook(
        book.bookCode,
        `${book.name} ${book.Author} ${book.ISBN}`,
      );
    }
  }
}
