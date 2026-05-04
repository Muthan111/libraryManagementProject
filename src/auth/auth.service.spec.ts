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
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
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

  describe('validateUser', () => {
    it('should return the user without the password when the credentials are valid', async () => {
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
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plain-password',
        'hashed-password',
      );
    });

    it('should return null when the user does not exist', async () => {
      const compareSpy = jest.spyOn(bcrypt, 'compare');
      userService.findUserByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('missing@example.com', 'plain-password'),
      ).resolves.toBeNull();
      expect(compareSpy).not.toHaveBeenCalled();
    });

    it('should return null when the password comparison fails', async () => {
      userService.findUserByEmail.mockResolvedValue({
        id: 2,
        name: 'Bob',
        email: 'bob@example.com',
        password: 'hashed-password',
        role: Role.MEMBER,
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.validateUser('bob@example.com', 'wrong-password'),
      ).resolves.toBeNull();
    });
  });

  describe('login', () => {
    it('should sign a JWT with the user id, email, and role and return it as an access token', async () => {
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
  });

  describe('testingAuthModule', () => {
    it('should return the authentication success message', async () => {
      await expect(service.testingAuthModule()).resolves.toBe(
        'Hello You are Successfully Logged In',
      );
    });
  });

  describe('testingRBAC', () => {
    it('should return the RBAC message', async () => {
      await expect(service.testingRBAC()).resolves.toBe(
        'Only admin can access this endpoint',
      );
    });
  });
});
