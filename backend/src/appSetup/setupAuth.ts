import * as passport from 'passport';
import { INestApplication } from '@nestjs/common';

export function setupAuth(app: INestApplication) {
  // Use Passport without express-session (JWT-only authentication)
  app.use(passport.initialize());
}
