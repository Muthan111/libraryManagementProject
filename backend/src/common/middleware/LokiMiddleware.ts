import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
@Injectable()
export class LokiMiddleware implements NestMiddleware {
  /*This middleware sends logs to a Loki logging server.
  It captures incoming requests and sends log entries to Loki for centralized logging and monitoring.
  */
  constructor() {}
  use(req: Request, res: Response, next: NextFunction) {
    const LOKI_URL = 'http://loki:3100/loki/api/v1/push'; // Corrected URL to use the service name 'loki'

    // Function to send logs
    async function sendLog(message, level = 'info') {
      const logEntry = {
        streams: [
          {
            stream: {
              job: 'OCR', // Label for the job
              level: level, // Label for log severity
            },
            values: [[`${Date.now()}000000`, message]], // Nanosecond timestamp
          },
        ],
      };

      try {
        const response = await axios.post(LOKI_URL, logEntry, {
          headers: { 'Content-Type': 'application/json' },
        });
        console.log('Log sent:', response.status);
      } catch (error) {
        console.error('Error sending log:', error.message);
      }
    }

    if (req.method === 'GET' && req.url === '/api/live/ws') {
      return next();
    }
    sendLog(`Request to ${req.url} with method ${req.method}`);
    next();
  }
}
