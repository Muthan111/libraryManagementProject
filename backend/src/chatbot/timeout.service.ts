import { Injectable, RequestTimeoutException } from '@nestjs/common';

@Injectable()
export class TimeoutService {
  async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    operationName: string,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(
          new RequestTimeoutException(
            `The ${operationName} exceeded ${timeoutMs}ms`,
          ),
        );
      }, timeoutMs);

      operation()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }
}
