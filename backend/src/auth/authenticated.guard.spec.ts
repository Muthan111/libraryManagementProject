import { ExecutionContext } from '@nestjs/common';
import { AuthenticatedGuard } from './authenticated.guard';

describe('AuthenticatedGuard', () => {
  let guard: AuthenticatedGuard;

  beforeEach(() => {
    guard = new AuthenticatedGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const createContext = (isAuthenticated: jest.Mock) =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({
            isAuthenticated,
          }),
        }),
      }) as ExecutionContext;

    it('should allow access when the request is authenticated', () => {
      const isAuthenticated = jest.fn().mockReturnValue(true);

      expect(guard.canActivate(createContext(isAuthenticated))).toBe(true);
      expect(isAuthenticated).toHaveBeenCalledTimes(1);
    });

    it('should deny access when the request is not authenticated', () => {
      const isAuthenticated = jest.fn().mockReturnValue(false);

      expect(guard.canActivate(createContext(isAuthenticated))).toBe(false);
      expect(isAuthenticated).toHaveBeenCalledTimes(1);
    });

    it('should propagate request authentication check errors', () => {
      const error = new Error('request state unavailable');
      const isAuthenticated = jest.fn(() => {
        throw error;
      });

      expect(() => guard.canActivate(createContext(isAuthenticated))).toThrow(
        error,
      );
      expect(isAuthenticated).toHaveBeenCalledTimes(1);
    });
  });
});
