import * as session from 'express-session';

import * as passport from 'passport';
import { INestApplication } from '@nestjs/common';
export function setupAuth(app: INestApplication, store: any) {
  app.use(
    session({
      store: store,
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 720000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
}
