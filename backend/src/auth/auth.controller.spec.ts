import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '../user/user.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should delegate login to AuthService with request.user', () => {
      const request = {
        user: {
          id: 3,
          email: 'controller@example.com',
          role: Role.ADMIN,
        },
      };

      authService.login.mockReturnValue({
        access_token: 'controller-token',
      });

      expect(controller.login(request as any)).toEqual({
        access_token: 'controller-token',
      });
      expect(authService.login).toHaveBeenCalledWith(request.user);
    });

    it('should pass undefined through if request.user is missing', () => {
      authService.login.mockReturnValue({ access_token: 'token' });

      expect(controller.login({} as any)).toEqual({ access_token: 'token' });
      expect(authService.login).toHaveBeenCalledWith(undefined);
    });

    it('should propagate errors from AuthService.login', async () => {
      authService.login.mockRejectedValue(new Error('login failed'));

      await expect(
        controller.login({
          user: { id: 1, email: 'a@a.com', role: Role.ADMIN },
        } as any),
      ).rejects.toThrow('login failed');
    });
  });
});
