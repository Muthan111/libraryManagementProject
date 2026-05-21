jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockImplementation(() => ({
        startChat: jest.fn((opts: any) => ({ started: true, opts })),
      })),
    })),
  };
});

import { ChatSessionFactory } from './chat-session.factory';

describe('ChatSessionFactory', () => {
  it('creates a chat session by passing history into startChat', () => {
    const factory = new ChatSessionFactory();
    const history = [{ role: 'user', parts: [{ text: 'hi' }] }];
    const res = factory.create(history as any);
    expect((res as any).started).toBe(true);
    expect((res as any).opts).toEqual({ history });
  });
});
