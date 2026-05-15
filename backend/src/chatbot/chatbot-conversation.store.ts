import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { redisClient } from '../config/redis';

export type ConversationHistoryEntry = {
  role: 'user' | 'model';
  text: string;
};

@Injectable()
export class ChatbotConversationStore {
  private readonly historyLimit = this.resolveHistoryLimit();
  private readonly ttlSeconds = this.resolveTtlSeconds();

  async getOrCreateConversationId(conversationId?: string): Promise<string> {
    return conversationId?.trim() || randomUUID();
  }

  async loadHistory(
    conversationId: string,
  ): Promise<ConversationHistoryEntry[]> {
    const rawHistory = await redisClient.get(this.getConversationKey(conversationId));

    if (!rawHistory) {
      return [];
    }

    try {
      const serializedHistory =
        typeof rawHistory === 'string'
          ? rawHistory
          : rawHistory.toString('utf8');
      const parsedHistory = JSON.parse(
        serializedHistory,
      ) as ConversationHistoryEntry[];

      return parsedHistory.filter(
        (entry) =>
          (entry.role === 'user' || entry.role === 'model') &&
          typeof entry.text === 'string',
      );
    } catch {
      return [];
    }
  }

  async appendTurn(
    conversationId: string,
    userMessage: string,
    reply: string,
  ): Promise<void> {
    const history = await this.loadHistory(conversationId);
    const nextHistory = [
      ...history,
      { role: 'user' as const, text: userMessage },
      { role: 'model' as const, text: reply },
    ].slice(-this.historyLimit);

    await redisClient.set(this.getConversationKey(conversationId), JSON.stringify(nextHistory), {
      EX: this.ttlSeconds,
    });
  }

  private getConversationKey(conversationId: string): string {
    return `chat:conversation:${conversationId}`;
  }

  private resolveHistoryLimit(): number {
    const parsedLimit = Number(process.env.CHAT_CONVERSATION_HISTORY_LIMIT);

    if (Number.isInteger(parsedLimit) && parsedLimit > 1) {
      return parsedLimit;
    }

    return 20;
  }

  private resolveTtlSeconds(): number {
    const parsedTtl = Number(process.env.CHAT_CONVERSATION_TTL_SECONDS);

    if (Number.isInteger(parsedTtl) && parsedTtl > 0) {
      return parsedTtl;
    }

    return 60 * 60 * 24;
  }
}
