import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from './book.entity';
import { CreateBookDto } from './createBook.dto';
import { UpdateBookDto } from './updateBook.dto';
import { User } from '../user/user.entity';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  findAll() {
    
    return this.bookRepository.find();
  }

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
    const savedBook = await this.bookRepository.save(enteredData);

    savedBook.bookCode = `BK${savedBook.bookid.toString().padStart(3, '0')}`;
    return this.bookRepository.save(savedBook);
  }

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
  async findBookByName(name: string) {
    try {
      const existingBook = await this.bookRepository.findOne({
        where: {name},

      })
      return existingBook;
    }
    catch {
      throw new NotFoundException("Error finding book by name")
    }
  }

  async findBookByISBN (ISBN: string) {
    try {
      const existingBook = await this.bookRepository.findOne({
        where: {ISBN}
      })
      return existingBook;
    }
    catch {
      throw new NotFoundException("Error finding book by ISBN")
    }
  }

  async findBookByAuthor(author: string){
    try {
      const existingBook = await this.bookRepository.findOne({
        where: {Author: author}
      })
      return existingBook;
    }
    catch {
      throw new NotFoundException("Error finding book by author")
    }
  }
}
