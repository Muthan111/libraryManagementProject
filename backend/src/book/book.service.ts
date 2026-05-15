import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './book.entity';
import { CreateBookDto } from './createBook.dto';
import { UpdateBookDto } from './updateBook.dto';
import { User } from '../user/user.entity';
import { generateCode } from 'src/utils/code-generator';
@Injectable()
export class BookService {
  // Injects repositories needed to manage books and related user lookups.
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // Returns every book currently stored in the database.
  findAll() {
    return this.bookRepository.find();
  }

  // Creates a book, enforcing unique ISBN values and generating a book code.
  // BUG: Double-save pattern in create() (same issue as before)
  async create(bookData: CreateBookDto) {
    const existingBook = await this.bookRepository.findOne({
      where: { ISBN: bookData.ISBN },
    });

    if (existingBook) {
      throw new ConflictException(
        `Book with ISBN ${bookData.ISBN} already exists`,
      );
    }

    const enteredData = this.bookRepository.create(bookData);
    const bookcode = generateCode('BK-XXXX-####');
    enteredData.bookCode = bookcode;
    const savedBook = await this.bookRepository.save(enteredData);

    savedBook.bookCode = `BK${savedBook.bookid.toString().padStart(3, '0')}`;
    return this.bookRepository.save(savedBook);
  }

  // Updates an existing book after confirming the target record exists.
  async update(bookid: number, bookData: UpdateBookDto) {
    const existingBook = await this.bookRepository.findOne({
      where: { bookid },
    });

    if (!existingBook) {
      throw new NotFoundException(`Book with id ${bookid} not found`);
    }

    Object.assign(existingBook, bookData);
    return this.bookRepository.save(existingBook);
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
  // async borrowBook(bookCode: string, customerCode: string) {
  //   // 1. Find user
  //   const user = await this.userRepo.findOne({
  //     where: { customerCode },
  //   });

  //   if (!user) {
  //     throw new NotFoundException('User not found');
  //   }

  //   // 2. Find book
  //   const book = await this.bookRepository.findOne({
  //     where: { bookCode },
  //   });

  //   if (!book) {
  //     throw new NotFoundException('Book not found');
  //   }

  //   // 3. Check if already borrowed
  //   if (book.borrowedById) {
  //     throw new BadRequestException('Book is already borrowed');
  //   }

  //   // 4. Assign book to user
  //   book.borrowedBy = user;
  //   book.status = 'BORROWED';

  //   // 5. Save
  //   return await this.bookRepository.save(book);
  // }
  //   async returnBook(bookCode: string) {
  //   const book = await this.bookRepository.findOne({
  //     where: { bookCode },
  //   });

  //   if (!book) {
  //     throw new NotFoundException('Book not found');
  //   }

  //   if (!book.borrowedById) {
  //     throw new BadRequestException('Book is not borrowed');
  //   }

  //   book.borrowedBy = null;
  //   book.status = 'AVAILABLE';

  //   return await this.bookRepository.save(book);
  // }
  // Finds a book by its exact name and surfaces a lookup error if one occurs.
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
