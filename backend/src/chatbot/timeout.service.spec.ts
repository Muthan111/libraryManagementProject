import { TimeoutService } from './timeout.service';
import { RequestTimeoutException } from '@nestjs/common';

describe('TimeoutService', () => {
  let ts: TimeoutService;

  beforeEach(() => {
    ts = new TimeoutService();
  });

  it('resolves fast operations', async () => {
    const res = await ts.withTimeout(Promise.resolve('ok'), 1000, 'fast op');
    expect(res).toBe('ok');
  });

  it('throws RequestTimeoutException on slow operations', async () => {
    const never = new Promise<string>(() => {
      /* never resolves */
    });

    await expect(ts.withTimeout(never, 10, 'slow')).rejects.toBeInstanceOf(
      RequestTimeoutException,
    );
  });
});
