import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { createApp } from '../../../src/app.factory';
import { AppModule } from '../../../src/app.module';
import { ChatSessionFactory } from '../../../src/chatbot/chat-session.factory';
import { RagSeeder } from '../../../src/chatbot/rag.seed';
import { RagService } from '../../../src/chatbot/rag.service';
import { disconnectRedis, resetRedis } from '../../../src/config/redis';
import {
  FakeChatSessionFactory,
  FakeRagSeeder,
  FakeRagService,
} from './test-doubles';

export async function createIntegrationApp(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(ChatSessionFactory)
    .useClass(FakeChatSessionFactory)
    .overrideProvider(RagService)
    .useClass(FakeRagService)
    .overrideProvider(RagSeeder)
    .useClass(FakeRagSeeder)
    .compile();

  const app = await createApp(moduleFixture);
  await app.init();
  return app;
}

export async function resetIntegrationState(app: INestApplication) {
  const dataSource = app.get(DataSource);
  const tableNames = dataSource.entityMetadatas
    .filter((metadata) => metadata.tableType === 'regular')
    .map((metadata) => metadata.tableName);

  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');

  try {
    for (const tableName of tableNames) {
      await dataSource.query(`TRUNCATE TABLE \`${tableName}\``);
    }
  } finally {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  await resetRedis();
}

export async function closeIntegrationApp(app?: INestApplication) {
  if (app) {
    await app.close();
  }

  await disconnectRedis();
}
