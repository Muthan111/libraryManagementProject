import { ToolExecutor } from './tool-executor';
import { BookService } from '../book/book.service';

describe('ToolExecutor', () => {
  let mockBookService: Partial<BookService>;
  let executor: ToolExecutor;

  beforeEach(() => {
    mockBookService = {
      findAll: jest.fn().mockResolvedValue(['book1', 'book2']),
      findBookByName: jest.fn().mockResolvedValue({ name: 'My Book' }),
      findBookByISBN: jest.fn().mockResolvedValue({ ISBN: '123' }),
      findBookByAuthor: jest.fn().mockResolvedValue([{ name: 'Book A' }]),
    };

    executor = new ToolExecutor(mockBookService as BookService);
  });

  it('runs findAllBooks', async () => {
    const res = await executor.run({ name: 'findAllBooks', args: {} });
    expect(res).toEqual(['book1', 'book2']);
    expect(mockBookService.findAll).toHaveBeenCalled();
  });

  it('runs findBookByName', async () => {
    const res = await executor.run({
      name: 'findBookByName',
      args: { name: 'x' },
    });
    expect(res).toEqual({ name: 'My Book' });
    expect(mockBookService.findBookByName).toHaveBeenCalledWith('x');
  });

  it('runs findBookByISBN', async () => {
    const res = await executor.run({
      name: 'findBookByISBN',
      args: { ISBN: '123' },
    });
    expect(res).toEqual({ ISBN: '123' });
    expect(mockBookService.findBookByISBN).toHaveBeenCalledWith('123');
  });

  it('runs findBookByAuthor', async () => {
    const res = await executor.run({
      name: 'findBookByAuthor',
      args: { author: 'a' },
    });
    expect(res).toEqual([{ name: 'Book A' }]);
    expect(mockBookService.findBookByAuthor).toHaveBeenCalledWith('a');
  });

  it('throws on unknown tool', async () => {
    await expect(
      executor.run({ name: 'unknownTool' } as unknown as any),
    ).rejects.toThrow(/Unknown tool/);
  });
});
