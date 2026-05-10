import { Controller, Get } from '@nestjs/common';
import * as client from 'prom-client';

const register = new client.Registry();

// collect default node + process metrics
client.collectDefaultMetrics({ register });

@Controller()
export class MetricsController {
  @Get('/metrics')
  async metrics() {
    return register.metrics();
  }
}
