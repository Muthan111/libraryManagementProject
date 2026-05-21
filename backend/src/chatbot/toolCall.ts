import { type Schema, type Tool } from '@google/generative-ai';
export const stringParameter = (description: string): Schema =>
  ({
    type: 'string' as unknown as Schema['type'],
    description,
  }) as unknown as Schema;
export const toolsArg: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'findAllBooks',
        description: 'Get all books from the library',
      },
      {
        name: 'findBookByName',
        description: 'Find a book by its name',
        parameters: {
          type: 'object' as unknown as Schema['type'],
          properties: {
            name: stringParameter('Name of the book'),
          },
          required: ['name'],
        },
      },
      {
        name: 'findBookByISBN',
        description: 'Find a book by its ISBN',
        parameters: {
          type: 'object' as unknown as Schema['type'],
          properties: {
            ISBN: stringParameter('ISBN of the book'),
          },
          required: ['ISBN'],
        },
      },
      {
        name: 'findBookByAuthor',
        description: 'Find books by author name',
        parameters: {
          type: 'object' as unknown as Schema['type'],
          properties: {
            author: stringParameter('Author name'),
          },
          required: ['author'],
        },
      },
    ],
  },
];
