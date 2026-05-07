import { NextFunction, Request, Response } from 'express';
import { LoggerMiddleware } from './logger.middleware';

describe('LoggerMiddleware', () => {
  let middleware: LoggerMiddleware;

  beforeEach(() => {
    middleware = new LoggerMiddleware();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('logs the request details after the response finishes', () => {
    const logSpy = jest.spyOn((middleware as any).logger, 'log');
    const next = jest.fn() as NextFunction;
    const finishHandlers: Array<() => void> = [];

    const req = {
      method: 'GET',
      originalUrl: '/books',
    } as Request;

    const res = {
      statusCode: 200,
      on: jest.fn((event: string, handler: () => void) => {
        if (event === 'finish') {
          finishHandlers.push(handler);
        }

        return res;
      }),
    } as unknown as Response;

    const nowSpy = jest.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(1000).mockReturnValueOnce(1125);

    middleware.use(req, res, next);

    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(next).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();

    finishHandlers[0]();

    expect(logSpy).toHaveBeenCalledWith('GET /books 200 - 125ms');

    nowSpy.mockRestore();
  });
});
