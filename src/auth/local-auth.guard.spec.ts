const mockCanActivate = jest.fn();
const mockLogIn = jest.fn();

jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn((strategy: string) => {
    class MockAuthGuard {
      canActivate(context: ExecutionContext) {
        return mockCanActivate(context);
      }

      logIn(request: unknown) {
        return mockLogIn(request);
      }
    }

    Object.defineProperty(MockAuthGuard, 'name', {
      value: `${strategy}AuthGuard`,
    });

    return MockAuthGuard;
  }),
}));

import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './local-auth.guard';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;
  let request: Record<string, unknown>;
  let context: ExecutionContext;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    guard = new LocalAuthGuard();
    request = { user: { id: 1, email: 'reader@example.com' } };
    context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    mockCanActivate.mockReset();
    mockLogIn.mockReset();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should configure the passport local strategy', () => {
    expect(AuthGuard).toHaveBeenCalledWith('local');
  });

  describe('canActivate', () => {
    it('should return the result from Passport and log in the request', async () => {
      mockCanActivate.mockResolvedValue(true);
      mockLogIn.mockResolvedValue(undefined);

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(mockCanActivate).toHaveBeenCalledWith(context);
      expect(mockLogIn).toHaveBeenCalledWith(request);
      expect(consoleSpy).toHaveBeenCalledWith('result', true);
    });

    it('should still call logIn when Passport returns false', async () => {
      mockCanActivate.mockResolvedValue(false);
      mockLogIn.mockResolvedValue(undefined);

      await expect(guard.canActivate(context)).resolves.toBe(false);

      expect(mockCanActivate).toHaveBeenCalledWith(context);
      expect(mockLogIn).toHaveBeenCalledWith(request);
      expect(consoleSpy).toHaveBeenCalledWith('result', false);
    });

    it('should propagate canActivate errors without attempting login', async () => {
      const error = new Error('authentication failed');
      mockCanActivate.mockRejectedValue(error);

      await expect(guard.canActivate(context)).rejects.toThrow(error);

      expect(mockLogIn).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should propagate logIn errors after successful authentication', async () => {
      const error = new Error('session setup failed');
      mockCanActivate.mockResolvedValue(true);
      mockLogIn.mockRejectedValue(error);

      await expect(guard.canActivate(context)).rejects.toThrow(error);

      expect(mockCanActivate).toHaveBeenCalledWith(context);
      expect(mockLogIn).toHaveBeenCalledWith(request);
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });
});
