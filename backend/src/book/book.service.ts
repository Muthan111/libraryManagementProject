import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from './book.entity';
import { CreateBookDto } from './createBook.dto';
import { UpdateBookDto } from './updateBook.dto';
import { generateCode } from 'src/utils/code-generator';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
@Injectable()
export class BookService {
  // Injects repositories needed to manage books and related user lookups.
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    private dataSource: DataSource,
  ) {}

  // Returns books with a paginated response envelope.
  async findAll(page = 1, limit = 10) {
    const validPage = Math.max(page, 1);
    const validLimit = Math.min(Math.max(limit, 1), 100);
    const [books, total] = await this.bookRepository.findAndCount({
      skip: (validPage - 1) * validLimit,
      take: validLimit,
    });

    return {
      data: books,
      meta: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
    };
  }

  // Creates a book, enforcing unique ISBN values and generating a book code.
  // BUG: Double-save pattern in create() (same issue as before)
  async create(bookData: CreateBookDto) {
    try {
      return this.dataSource.transaction(async (manager) => {
        const bookRepository = manager.getRepository(Book);
        const existingBook = await bookRepository.findOne({
          where: { ISBN: bookData.ISBN },
        });
        if (existingBook) {
          throw new ConflictException(
            `Book with ISBN ${bookData.ISBN} already exists`,
          );
        }
        const enteredData = bookRepository.create(bookData);
        const bookcode = generateCode('BK-XXXX-####');
        enteredData.bookCode = bookcode;
        const savedBook = await bookRepository.save(enteredData);
        return savedBook;
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          `Book with ISBN ${bookData.ISBN} already exists`,
        );
      }

      throw error;
    }
  }

  // Updates an existing book after confirming the target record exists.
  async update(bookCode: string, bookData: UpdateBookDto) {
    const updatePayload: Partial<Book> = {};

    if (bookData.name !== undefined) {
      updatePayload.name = bookData.name;
    }
    if (bookData.Author !== undefined) {
      updatePayload.Author = bookData.Author;
    }
    if (bookData.ISBN !== undefined) {
      updatePayload.ISBN = bookData.ISBN;
    }
    const existingBook = await this.bookRepository.findOne({
      where: { bookCode },
    });
    if (Object.keys(updatePayload).length === 0) {
      return existingBook;
    }
    try {
      const result = await this.bookRepository.update(
        { bookCode },
        updatePayload,
      );
      if (result.affected === 0) {
        throw new NotFoundException(`Book with code ${bookCode} not found`);
      }
      const updatedBook = await this.bookRepository.findOne({
        where: { bookCode },
      });
      return updatedBook;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException('User update violates a unique constraint');
      }

      throw error;
    }
    return existingBook;
  }

  // Deletes a book by id and reports success when the record is removed.
  // BUG: ❗ delete() does not check soft delete possibility
  async delete(bookid: number) {
    const deleteResult = await this.bookRepository.delete({ bookid });

    if (!deleteResult.affected) {
      throw new NotFoundException(`Book with id ${bookid} not found`);
    }

    return {
      message: `Book with id ${bookid} deleted successfully`,
    };
  }
  async findBookByName(name: string) {
    try {
      const existingBook = await this.bookRepository.findOne({
        where: { name },
      });
      return existingBook;
    } catch {
      throw new NotFoundException('Error finding book by name');
    }
  }

  // Finds a book by ISBN and surfaces a lookup error if one occurs.
  async findBookByISBN(ISBN: string) {
    try {
      const existingBook = await this.bookRepository.findOne({
        where: { ISBN },
      });
      return existingBook;
    } catch {
      throw new NotFoundException('Error finding book by ISBN');
    }
  }

  // Finds a book by author name and surfaces a lookup error if one occurs.
  async findBookByAuthor(author: string) {
    try {
      const existingBook = await this.bookRepository.findOne({
        where: { Author: author },
      });
      return existingBook;
    } catch {
      throw new NotFoundException('Error finding book by author');
    }
  }
}
