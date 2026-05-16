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
