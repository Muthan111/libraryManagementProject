import helmet from 'helmet';
// import { NestExpressApplication } from '@nestjs/platform-express';
import { INestApplication } from '@nestjs/common';
export function setupSecurity(app: INestApplication) {
  app.use(
    helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
}),
  );
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });
  const httpAdapter = app.getHttpAdapter();

  if (httpAdapter.getType() === 'express') {
    const instance = httpAdapter.getInstance();
    instance.disable('x-powered-by');
  }
}
