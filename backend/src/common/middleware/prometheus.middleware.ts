import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class PrometheusMiddleware implements NestMiddleware {
  /*This middleware logs incoming requests and increments Prometheus counters for total requests and exceptions.
  It helps monitor the overall request traffic and error rates in the application.
  */
  constructor(
    @InjectMetric('http_requests_total')
    private readonly httpRequestCounter: Counter<string>,
    @InjectMetric('http_errors_total')
    private readonly httpExceptionCounter: Counter<string>,
    @InjectMetric('auth_requests_total')
    private readonly authRequestCounter: Counter<string>,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    this.httpRequestCounter.inc();

    if (req.path.startsWith('/auth')) {
      this.authRequestCounter.inc();
    }

    res.on('finish', () => {
      if (res.statusCode >= 400) {
        this.httpExceptionCounter.inc();
      }
    });

    next();
  }
}
