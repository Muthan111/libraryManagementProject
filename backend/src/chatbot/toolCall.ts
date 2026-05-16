import { SchemaType, type Schema, type Tool } from '@google/generative-ai';
export const stringParameter = (description: string): Schema => ({
  type: SchemaType.STRING,
  description,
});
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
          type: SchemaType.OBJECT,
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
          type: SchemaType.OBJECT,
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
          type: SchemaType.OBJECT,
          properties: {
            author: stringParameter('Author name'),
          },
          required: ['author'],
        },
      },
    ],
  },
];
