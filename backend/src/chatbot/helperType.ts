export type ToolCall =
  | { name: 'findAllBooks'; args: Record<string, never> }
  | { name: 'findBookByName'; args: { name: string } }
  | { name: 'findBookByISBN'; args: { ISBN: string } }
  | { name: 'findBookByAuthor'; args: { author: string } };

export type ChatMessage =
  | string
  | [
      {
        functionResponse: {
          name: ToolCall['name'];
          response: {
            result: unknown;
          };
        };
      },
    ];

export type ChatReply = {
  reply: string;
  conversationId: string;
};
export type ModelResponse = {
  text: () => string;
  candidates?: Array<{
    content?: {
      parts?: Array<{
        functionCall?: unknown;
      }>;
    };
  }>;
};

export type ChatSession = {
  sendMessage: (message: ChatMessage | string) => Promise<{
    response: ModelResponse;
  }>;
};
