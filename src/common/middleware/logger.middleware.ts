import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggerMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();

    // Memory before request (in MB)
    const memoryBefore = process.memoryUsage().heapUsed / 1024 / 1024;

    // CPU snapshot before request
    const cpuBefore = process.cpuUsage();

    const { method, originalUrl } = req;

    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;

      // Memory after request
      const memoryAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryDiff = memoryAfter - memoryBefore;

      // CPU usage diff (microseconds)
      const cpuAfter = process.cpuUsage(cpuBefore);

      const cpuUserMs = cpuAfter.user / 1000;
      const cpuSystemMs = cpuAfter.system / 1000;

      this.logger.log(
        [
          `${method} ${originalUrl} ${res.statusCode}`,
          `${durationMs.toFixed(2)}ms`,
          `memory ${memoryDiff.toFixed(2)}MB`,
          `CPU user ${cpuUserMs.toFixed(2)}ms system ${cpuSystemMs.toFixed(2)}ms`,
        ].join(' | '),
      );
    });

    next();
  }
}
