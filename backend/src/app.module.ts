import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getEnvFilePaths } from './config/env-paths';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookModule } from './book/book.module';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { AuthModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { BorrowModule } from './borrow/borrow.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { MetricsModule } from './metrics/metrics.module';
import { PrometheusMiddleware } from '../src/common/middleware/prometheus.middleware';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: getEnvFilePaths(),
    }),
    UserModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<number>('DB_PORT')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
        extra: { connectionLimit: 10 },
      }),
    }),
    BookModule,
    AuthModule,
    PassportModule.register({ session: true }),
    BorrowModule,
    ChatbotModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60, // time window in seconds
        limit: 10, // max requests per window
      },
    ]),
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
    consumer
      .apply(PrometheusMiddleware)
      .exclude({ path: 'metrics', method: RequestMethod.GET })
      .exclude({ path: 'driver/login', method: RequestMethod.POST })
      .exclude({ path: 'api', method: RequestMethod.GET })
      .exclude({ path: 'api/live/ws', method: RequestMethod.GET })
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
