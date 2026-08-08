import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatbotRedisProvider } from './chatbot-redis.provider';

@Injectable()
export class RagService {
  private genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  private embeddingModel = this.genAI.getGenerativeModel({
    model: 'gemini-embedding-001',
  });
  constructor(private readonly redisProvider: ChatbotRedisProvider) {}

  async embed(text: string): Promise<number[]> {
    const result = await this.embeddingModel.embedContent(text);
    return result.embedding.values;
  }
  chunkText(text: string, size = 500): string[] {
    const chunks: string[] = [];

    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.slice(i, i + size));
    }

    return chunks;
  }

  async indexBook(bookId: string, content: string) {
    const redisClient = await this.redisProvider.getClient();

    const keys = await redisClient.keys(`rag:book:${bookId}:*`);
    if (keys.length) {
      await redisClient.del(keys);
    }
    const chunks = this.chunkText(content);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const vector = await this.embed(chunk);

      await redisClient.set(
        `rag:book:${bookId}:${i}`,
        JSON.stringify({
          text: chunk,
          vector,
        }),
      );
    }
  }
  cosine(a: number[], b: number[]) {
    let dot = 0,
      magA = 0,
      magB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }

    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  }
  async search(query: string) {
    const queryVector = await this.embed(query);

    const redisClient = await this.redisProvider.getClient();

    const keys = await redisClient.keys('rag:book:*');

    const results: { text: string; score: number }[] = [];

    for (const key of keys) {
      const raw = await redisClient.get(key);
      if (!raw) continue;

      const serialized = typeof raw === 'string' ? raw : raw.toString('utf8');

      const data = JSON.parse(serialized);

      const score = this.cosine(queryVector, data.vector);

      results.push({
        text: data.text,
        score,
      });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, 3);
  }
}
