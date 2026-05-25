import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('handleRequest', () => {
    it('should return the user when authentication succeeds', () => {
      const user = { userId: 1, email: 'reader@example.com', role: 'member' };

      expect(guard.handleRequest(null, user)).toBe(user);
    });

    it('should throw UnauthorizedException when passport returns an error', () => {
      expect(() =>
        guard.handleRequest(new Error('token invalid'), { userId: 1 }),
      ).toThrow(new UnauthorizedException('Unauthorized access'));
    });

    it('should throw UnauthorizedException when no user is present', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(
        new UnauthorizedException('Unauthorized access'),
      );
    });
  });
});
