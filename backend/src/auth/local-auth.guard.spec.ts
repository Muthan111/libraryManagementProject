const mockCanActivate = jest.fn();

jest.mock('@nestjs/passport', () => ({
  AuthGuard: jest.fn((strategy: string) => {
    class MockAuthGuard {
      canActivate(context: unknown) {
        return mockCanActivate(context);
      }
    }

    Object.defineProperty(MockAuthGuard, 'name', {
      value: `${strategy}AuthGuard`,
    });

    return MockAuthGuard;
  }),
}));

import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './local-auth.guard';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(() => {
    mockCanActivate.mockReset();
    guard = new LocalAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should configure the passport local strategy', () => {
    expect(AuthGuard).toHaveBeenCalledWith('local');
  });

  it('should expose the inherited canActivate implementation', () => {
    const context = { type: 'http' };
    mockCanActivate.mockReturnValue(true);

    expect(guard.canActivate(context as any)).toBe(true);
    expect(mockCanActivate).toHaveBeenCalledWith(context);
  });
});
