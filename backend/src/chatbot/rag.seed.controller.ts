import { Controller, Get } from '@nestjs/common';
import { RagSeeder } from './rag.seed';

@Controller('rag')
export class RagController {
  constructor(private readonly ragSeeder: RagSeeder) {}

  @Get('seed')
  async seed() {
    await this.ragSeeder.indexAllBooks();
    return { message: 'RAG indexing complete' };
  }
}