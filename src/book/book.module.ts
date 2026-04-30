import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { book } from './book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([book])],
  providers: [BookService],
  controllers: [BookController],
})
export class BookModule {}
