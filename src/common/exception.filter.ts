import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalException');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : 500;

    const response =
  exception instanceof HttpException
    ? exception.getResponse()
    : null;

const message =
  typeof response === 'string'
    ? response
    : (response as any)?.message || exception.message;

    // 🔥 THIS is your production error log
    this.logger.error(
  `\n[ERROR]
Path: ${req.url}
Method: ${req.method}
Status: ${status}
Message: ${message}
Stack: ${exception.stack}\n`,
);

    res.status(status).json({
      statusCode: status,
      message,
    });
  }
}