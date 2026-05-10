jest.mock(
  'src/book/book.entity',
  () => ({
    Book: class Book {},
  }),
  { virtual: true },
);

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '../user/user.enum';

describe('AuthController', () => {
  let controller: AuthController;

  let authService: {
    login: jest.Mock;
    testingAuthModule: jest.Mock;
    testingRBAC: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      testingAuthModule: jest.fn(),
      testingRBAC: jest.fn(),
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

  // =========================
  // LOGIN
  // =========================
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

      const result = controller.login(request as any);

      expect(result).toEqual({
        access_token: 'controller-token',
      });

      expect(authService.login).toHaveBeenCalledWith(request.user);
    });

    it('should pass through extra user fields untouched', () => {
      const request = {
        user: {
          id: 9,
          email: 'member@example.com',
          role: Role.MEMBER,
          customerCode: 'cus009',
        },
      };

      authService.login.mockReturnValue({
        access_token: 'member-token',
      });

      const result = controller.login(request as any);

      expect(result).toEqual({
        access_token: 'member-token',
      });

      expect(authService.login).toHaveBeenCalledWith(request.user);
    });

    it('should not modify user object before passing to service', () => {
      const user = {
        id: 1,
        email: 'test@test.com',
        role: Role.ADMIN,
      };

      const request = { user };

      authService.login.mockReturnValue({
        access_token: 'token',
      });

      controller.login(request as any);

      expect(authService.login).toHaveBeenCalledWith(user);
    });

    it('should pass undefined user if request.user is missing', () => {
      authService.login.mockReturnValue({ access_token: 'token' });

      const result = controller.login({} as any);

      expect(authService.login).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({ access_token: 'token' });
    });

    it('should propagate sync errors from AuthService.login', () => {
      const request = {
        user: { id: 1, email: 'a@a.com', role: Role.ADMIN },
      };

      authService.login.mockImplementation(() => {
        throw new Error('login failed');
      });

      expect(() => controller.login(request as any)).toThrow('login failed');
    });

    it('should propagate async errors from AuthService.login', async () => {
      const request = {
        user: { id: 1, email: 'a@a.com', role: Role.ADMIN },
      };

      authService.login.mockRejectedValue(new Error('async fail'));

      await expect(controller.login(request as any)).rejects.toThrow(
        'async fail',
      );
    });
  });

  // =========================
  // AUTH TEST ENDPOINT
  // =========================
  describe('testAuthentication', () => {
    it('should return success message', async () => {
      authService.testingAuthModule.mockResolvedValue(
        'Hello You are Successfully Logged In',
      );

      await expect(controller.testAuthentication()).resolves.toBe(
        'Hello You are Successfully Logged In',
      );

      expect(authService.testingAuthModule).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from AuthService.testingAuthModule', async () => {
      authService.testingAuthModule.mockRejectedValue(new Error('auth failed'));

      await expect(controller.testAuthentication()).rejects.toThrow(
        'auth failed',
      );
    });
  });

  // =========================
  // RBAC
  // =========================
  describe('testingRBAC', () => {
    it('should delegate to AuthService', async () => {
      authService.testingRBAC.mockResolvedValue(
        'Only admin can access this endpoint',
      );

      await expect(controller.testingRBAC()).resolves.toBe(
        'Only admin can access this endpoint',
      );

      expect(authService.testingRBAC).toHaveBeenCalledTimes(1);
    });

    it('should propagate RBAC denial errors', async () => {
      authService.testingRBAC.mockRejectedValue(new Error('Forbidden'));

      await expect(controller.testingRBAC()).rejects.toThrow('Forbidden');
    });
  });
});
