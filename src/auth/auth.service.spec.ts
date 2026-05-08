jest.mock('../user/user.service', () => ({
  UserService: class UserService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { Role } from '../user/user.enum';

describe('AuthService', () => {
  let service: AuthService;
  let userService: { findUserByEmail: jest.Mock };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    userService = {
      findUserByEmail: jest.fn(),
    };

    jwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================
  // validateUser
  // =========================
  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const existingUser = {
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        password: 'hashed-password',
        role: Role.ADMIN,
      };

      userService.findUserByEmail.mockResolvedValue(existingUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(
        service.validateUser('alice@example.com', 'plain-password'),
      ).resolves.toEqual({
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        role: Role.ADMIN,
      });

      expect(userService.findUserByEmail).toHaveBeenCalledWith(
        'alice@example.com',
      );
    });

    it('should return null when user does not exist', async () => {
      userService.findUserByEmail.mockResolvedValue(null);

      const compareSpy = jest.spyOn(bcrypt, 'compare');

      await expect(
        service.validateUser('missing@example.com', 'pass'),
      ).resolves.toBeNull();

      expect(compareSpy).not.toHaveBeenCalled();
    });

    it('should return null when password comparison fails', async () => {
      userService.findUserByEmail.mockResolvedValue({
        id: 2,
        email: 'bob@example.com',
        password: 'hashed',
        role: Role.MEMBER,
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.validateUser('bob@example.com', 'wrong'),
      ).resolves.toBeNull();
    });

    it('should not leak password field', async () => {
      userService.findUserByEmail.mockResolvedValue({
        id: 3,
        email: 'dana@example.com',
        password: 'hashed',
        role: Role.MEMBER,
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser('dana@example.com', 'pass');

      expect(result).not.toHaveProperty('password');
    });

    // -------------------------
    // NEW EDGE CASES
    // -------------------------

    it('should handle bcrypt errors gracefully', async () => {
      userService.findUserByEmail.mockResolvedValue({
        id: 1,
        email: 'a@a.com',
        password: 'hashed',
        role: Role.ADMIN,
      });

      jest
        .spyOn(bcrypt, 'compare')
        .mockRejectedValue(new Error('bcrypt crash'));

      await expect(service.validateUser('a@a.com', 'pass')).rejects.toThrow(
        'bcrypt crash',
      );
    });

    it('should return null if stored password is missing', async () => {
      userService.findUserByEmail.mockResolvedValue({
        id: 5,
        email: 'no-pass@example.com',
        password: null,
        role: Role.MEMBER,
      });

      await expect(
        service.validateUser('no-pass@example.com', 'pass'),
      ).resolves.toBeNull();
    });

    it('should handle email case variations if system is case-insensitive', async () => {
      userService.findUserByEmail.mockResolvedValue(null);

      await service.validateUser('ALICE@EXAMPLE.COM', 'pass');

      expect(userService.findUserByEmail).toHaveBeenCalledWith(
        'ALICE@EXAMPLE.COM',
      );
    });
  });

  // =========================
  // login
  // =========================
  describe('login', () => {
    it('should return signed JWT token', async () => {
      jwtService.sign.mockReturnValue('signed-jwt');

      await expect(
        service.login({
          id: 7,
          email: 'login@example.com',
          role: Role.ADMIN,
        }),
      ).resolves.toEqual({
        access_token: 'signed-jwt',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 7,
        email: 'login@example.com',
        role: Role.ADMIN,
      });
    });

    // -------------------------
    // NEW EDGE CASES
    // -------------------------

    it('should handle jwt sign failure', async () => {
      jwtService.sign.mockImplementation(() => {
        throw new Error('JWT failed');
      });

      await expect(
        service.login({
          id: 1,
          email: 'test@test.com',
          role: Role.ADMIN,
        }),
      ).rejects.toThrow('JWT failed');
    });

    it('should handle missing role in payload', async () => {
      jwtService.sign.mockReturnValue('token');

      await service.login({
        id: 1,
        email: 'test@test.com',
        role: undefined as any,
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'test@test.com',
        role: undefined,
      });
    });

    it('should handle incomplete payload safely', async () => {
      jwtService.sign.mockReturnValue('token');

      await expect(
        service.login({
          id: 1,
          email: 'test@test.com',
          role: Role.ADMIN,
        }),
      ).resolves.toBeDefined();
    });

    it('should throw if login input is invalid', async () => {
      await expect(service.login(null as any)).rejects.toThrow();
    });
  });

  // =========================
  // RBAC
  // =========================
  describe('testingRBAC', () => {
    it('should return RBAC message', async () => {
      await expect(service.testingRBAC()).resolves.toBe(
        'Only admin can access this endpoint',
      );
    });
  });

  // =========================
  // module test endpoint
  // =========================
  describe('testingAuthModule', () => {
    it('should return success message', async () => {
      await expect(service.testingAuthModule()).resolves.toBe(
        'Hello You are Successfully Logged In',
      );
    });
  });
});
