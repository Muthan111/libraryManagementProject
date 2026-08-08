import { Injectable, OnModuleInit } from '@nestjs/common';
import { connectRedis, redisClient } from '../config/redis';

@Injectable()
export class ChatbotRedisProvider implements OnModuleInit {
  async onModuleInit() {
    await connectRedis();
  }

  async getClient() {
    await connectRedis();
    return redisClient;
  }
}
