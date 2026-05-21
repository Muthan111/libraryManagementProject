import { Injectable } from '@nestjs/common';
import { ConversationHistoryEntry } from './chatbot-conversation.store';
import { HISTORY_SYSTEM_PROMPT, INITIAL_PROMPT } from './chatVariables';

@Injectable()
export class PromptBuilder {
  buildInitialPrompt(message: string): string {
    return [...INITIAL_PROMPT, '', 'User message:', message].join('\n');
  }

  buildChatHistory(history: ConversationHistoryEntry[]): any[] {
    return [
      {
        role: 'user',
        parts: [
          {
            text: HISTORY_SYSTEM_PROMPT.join('\n'),
          },
        ],
      },
      ...history.map((entry) => ({
        role: entry.role,
        parts: [{ text: entry.text }],
      })),
    ];
  }

  buildRagEnrichedMessage(context: string, message: string): string {
    const enrichedMessage = context.length
      ? `\nYou are a library assistant.\n\nUse the context below:\n\nCONTEXT:\n${context}\n\nUSER QUESTION:\n${message}\n`
      : `\nYou are a library assistant.\n\nAnswer normally.\n\nUSER QUESTION:\n${message}\n`;

    return enrichedMessage;
  }
}
