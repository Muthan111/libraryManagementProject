import { Injectable, NestMiddleware } from '@nestjs/common';
import axios from 'axios';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LokiMiddleware implements NestMiddleware {
  /*This middleware sends logs to a Loki logging server.
  It captures incoming requests and sends log entries to Loki for centralized logging and monitoring.
  */
  private readonly lokiUrl = 'http://loki:3100/loki/api/v1/push';
  private readonly loggingEnabled =
    process.env.NODE_ENV !== 'test' &&
    process.env.DISABLE_LOKI_LOGGING !== 'true';

  use(req: Request, res: Response, next: NextFunction) {
    if (!this.loggingEnabled) {
      next();
      return;
    }

    if (req.method === 'GET' && req.url === '/api/live/ws') {
      next();
      return;
    }

    void this.sendLog(`Request to ${req.url} with method ${req.method}`);
    next();
  }

  private async sendLog(message: string, level = 'info') {
    const logEntry = {
      streams: [
        {
          stream: {
            job: 'Library Management System',
            level,
          },
          values: [[`${Date.now()}000000`, message]],
        },
      ],
    };

    try {
      await axios.post(this.lokiUrl, logEntry, {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Error sending log:', error);
      }
    }
  }
}
