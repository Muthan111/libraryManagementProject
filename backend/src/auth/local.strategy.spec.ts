import { Test, TestingModule } from '@nestjs/testing';
import { HttpException } from '@nestjs/common';
import { LocalStrategy } from './local.strategy';
import { AuthService } from './auth.service';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: { validateUser: jest.Mock };

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return the validated user from AuthService', async () => {
      const user = {
        id: 1,
        email: 'reader@example.com',
        role: 'member',
      };

      authService.validateUser.mockResolvedValue(user);

      await expect(
        strategy.validate('reader@example.com', 'plain-password'),
      ).resolves.toEqual(user);

      expect(authService.validateUser).toHaveBeenCalledWith(
        'reader@example.com',
        'plain-password',
      );
    });

    it('should throw HttpException when AuthService returns null', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(
        strategy.validate('reader@example.com', 'wrong-password'),
      ).rejects.toThrow(
        new HttpException(
          'Unauthorized: Please enter the correct details',
          401,
        ),
      );
    });

    it('should propagate AuthService errors', async () => {
      authService.validateUser.mockRejectedValue(new Error('service failure'));

      await expect(
        strategy.validate('reader@example.com', 'plain-password'),
      ).rejects.toThrow('service failure');
    });
  });
});
