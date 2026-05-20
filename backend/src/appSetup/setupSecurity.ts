import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
export function setupSecurity(app: NestExpressApplication) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
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
  app.disable('x-powered-by');
}
