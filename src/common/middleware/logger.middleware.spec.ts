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

    const hrtimeSpy = jest.spyOn(process.hrtime, 'bigint');
    hrtimeSpy.mockReturnValueOnce(1_000_000_000n);
    hrtimeSpy.mockReturnValueOnce(1_125_000_000n);

    const memoryUsageSpy = jest.spyOn(process, 'memoryUsage');
    memoryUsageSpy
      .mockReturnValueOnce({
        heapUsed: 10 * 1024 * 1024,
      } as NodeJS.MemoryUsage)
      .mockReturnValueOnce({
        heapUsed: 10.24 * 1024 * 1024,
      } as NodeJS.MemoryUsage);

    const cpuUsageSpy = jest.spyOn(process, 'cpuUsage');
    cpuUsageSpy
      .mockReturnValueOnce({
        user: 0,
        system: 0,
      })
      .mockReturnValueOnce({
        user: 0,
        system: 0,
      });

    middleware.use(req, res, next);

    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(next).toHaveBeenCalledTimes(1);
    expect(logSpy).not.toHaveBeenCalled();

    finishHandlers[0]();

    expect(logSpy).toHaveBeenCalledWith(
      'GET /books 200 | ⏱ 125.00ms | 🧠 ΔMemory 0.24MB | 🔥 CPU user 0.00ms system 0.00ms',
    );

    hrtimeSpy.mockRestore();
    memoryUsageSpy.mockRestore();
    cpuUsageSpy.mockRestore();
  });
});
