import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
const metricsProviders = [
  makeCounterProvider({
    name: 'Authentication_call',
    help: 'Number of times the authentication endpoint was called',
  }),
  makeCounterProvider({
    name: 'http_exceptions',
    help: 'Number of HTTP exceptions',
  }),
  makeCounterProvider({
    name: 'http_requests',
    help: 'Number of HTTP requests',
  }),
  makeCounterProvider({
    name: 'active_User',
    help: 'Number of active users',
  }),
  makeHistogramProvider({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    buckets: [0.1, 0.5, 1, 2.5, 5],
  }),
];
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  controllers: [MetricsController],
  providers: [...metricsProviders],
  exports: [...metricsProviders],
})
export class MetricsModule {}
