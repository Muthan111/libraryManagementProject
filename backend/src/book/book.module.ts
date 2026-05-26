import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { Book } from './book.entity';
import { User } from '../user/user.entity';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [TypeOrmModule.forFeature([Book, User]), MetricsModule],
  providers: [BookService],
  controllers: [BookController],
  exports: [BookService],
})
export class BookModule {}
