import { Module } from '@nestjs/common';
import { BorrowService } from './borrow.service';
import { BorrowController } from './borrow.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Book } from '../book/book.entity';
import { BorrowRecord } from './borrow.entity';
import { MetricsModule } from '../metrics/metrics.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([BorrowRecord, User, Book]),
    MetricsModule,
  ],
  providers: [BorrowService],
  controllers: [BorrowController],
})
export class BorrowModule {}
