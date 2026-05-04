jest.mock('src/book/book.entity', () => ({
  Book: class Book {},
}), { virtual: true });

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

  describe('login', () => {
    it('should delegate to AuthService.login with the authenticated request user', () => {
      const request = {
        user: {
          id: 3,
          email: 'controller@example.com',
          role: Role.ADMIN,
        },
      };
      const authResponse = { access_token: 'controller-token' };

      authService.login.mockReturnValue(authResponse);

      expect(controller.login(request)).toEqual(authResponse);
      expect(authService.login).toHaveBeenCalledWith(request.user);
    });
  });

  describe('testAuthentication', () => {
    it('should return the protected authentication test message', async () => {
      authService.testingAuthModule.mockResolvedValue(
        'Hello You are Successfully Logged In',
      );

      await expect(controller.testAuthentication()).resolves.toBe(
        'Hello You are Successfully Logged In',
      );
      expect(authService.testingAuthModule).toHaveBeenCalledTimes(1);
    });
  });

  describe('testingRBAC', () => {
    it('should delegate to the auth service', async () => {
      authService.testingRBAC.mockResolvedValue(
        'Only admin can access this endpoint',
      );

      await expect(controller.testingRBAC()).resolves.toBe(
        'Only admin can access this endpoint',
      );
      expect(authService.testingRBAC).toHaveBeenCalledTimes(1);
    });
  });
});
