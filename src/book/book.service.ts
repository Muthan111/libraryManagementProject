import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { book } from './book.entity';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(book)
    private bookRepository: Repository<book>,
  ) {}

  findAll() {
    return this.bookRepository.find();
  }

  async create(bookData: Partial<book>) {
    const enteredData = this.bookRepository.create(bookData);
    const savedBook = await this.bookRepository.save(enteredData);

    savedBook.bookCode = `BK${savedBook.bookid.toString().padStart(3, '0')}`;
    return this.bookRepository.save(savedBook);
  }

  async update(bookid: number, bookData: Partial<book>) {
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
}
