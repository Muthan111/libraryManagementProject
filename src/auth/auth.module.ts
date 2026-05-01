import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { SessionSerializer } from './session.serializer';

@Module({
  imports: [UserModule, PassportModule.register({ defaultStrategy: 'jwt', session: true }), JwtModule.register({
    secret: 'secret',
    signOptions: { expiresIn: '60s' },
  })],
  providers: [AuthService, LocalStrategy, JwtStrategy, SessionSerializer],
  controllers: [AuthController]
})
export class AuthModule {}
