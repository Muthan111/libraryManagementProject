import {
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';
export const metricsProviders = [
  makeCounterProvider({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
  }),
  makeCounterProvider({
    name: 'http_errors_total',
    help: 'Total number of HTTP errors',
  }),
  makeCounterProvider({
    name: 'auth_requests_total',
    help: 'Total authentication requests',
  }),
  makeCounterProvider({
    name: 'auth_failures_total',
    help: 'Total failed authentication attempts',
  }),
  makeCounterProvider({
    name: 'book_operations_total',
    help: 'Total number of book operations',
  }),
  makeGaugeProvider({
    name: 'active_users',
    help: 'Number of currently active users',
  }),
  makeCounterProvider({
    name: 'user_created_total',
    help: 'Total number of users created',
  }),
  makeCounterProvider({
    name: 'chatbot_requests_total',
    help: 'Total number of chatbot requests',
  }),
  makeHistogramProvider({
    name: 'chatbot_response_duration_seconds',
    help: 'Chatbot response time in seconds',
    buckets: [0.1, 0.5, 1, 2.5, 5],
  }),
  makeCounterProvider({
    name: 'book_fetch_requests_total',
    help: 'Total number of book fetch requests',
  }),
  makeGaugeProvider({
    name: 'memory_usage_bytes',
    help: 'Memory usage of the service',
  }),
  makeGaugeProvider({
    name: 'cpu_usage_percent',
    help: 'CPU usage of the service',
  }),
];
