import { UnauthorizedException } from '@nestjs/common';
import { Role } from '../user/user.enum';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userRepository: { findOne: jest.Mock };

  beforeEach(() => {
    userRepository = {
      findOne: jest.fn(),
    };

    strategy = new JwtStrategy(userRepository as any);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return the mapped auth user when the user still exists', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 42,
        email: 'librarian@example.com',
        role: Role.ADMIN,
      });

      await expect(
        strategy.validate({
          sub: 42,
          email: 'librarian@example.com',
          role: Role.ADMIN,
        }),
      ).resolves.toEqual({
        userId: 42,
        email: 'librarian@example.com',
        role: Role.ADMIN,
      });

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 42 },
      });
    });

    it('should throw UnauthorizedException when the user no longer exists', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        strategy.validate({
          sub: 7,
          email: 'missing@example.com',
          role: Role.MEMBER,
        }),
      ).rejects.toThrow(
        new UnauthorizedException('User no longer exists'),
      );
    });
  });
});
