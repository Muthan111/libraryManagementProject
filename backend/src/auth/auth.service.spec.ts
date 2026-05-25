import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../user/user.enum';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: Pick<JwtService, 'sign'>;
  let userRepository: { findOne: jest.Mock };

  beforeEach(() => {
    jwtService = {
      sign: jest.fn(),
    };

    userRepository = {
      findOne: jest.fn(),
    };

    service = new AuthService(userRepository as any, jwtService as JwtService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return the auth user shape when credentials are valid', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'Alice',
        email: 'alice@example.com',
        password: 'hashed-password',
        role: Role.ADMIN,
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      await expect(
        service.validateUser('alice@example.com', 'plain-password'),
      ).resolves.toEqual({
        id: 1,
        email: 'alice@example.com',
        role: Role.ADMIN,
      });

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'alice@example.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'plain-password',
        'hashed-password',
      );
    });

    it('should throw UnauthorizedException when the password does not match', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 2,
        email: 'reader@example.com',
        password: 'hashed-password',
        role: Role.MEMBER,
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(
        service.validateUser('reader@example.com', 'wrong-password'),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });

    it('should throw UnauthorizedException when the user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateUser('missing@example.com', 'plain-password'),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
    });

    it('should propagate bcrypt failures', async () => {
      userRepository.findOne.mockResolvedValue({
        id: 3,
        email: 'broken@example.com',
        password: 'hashed-password',
        role: Role.MEMBER,
      });

      jest
        .spyOn(bcrypt, 'compare')
        .mockRejectedValue(new Error('bcrypt crash'));

      await expect(
        service.validateUser('broken@example.com', 'plain-password'),
      ).rejects.toThrow('bcrypt crash');
    });
  });

  describe('login', () => {
    it('should sign and return an access token', async () => {
      (jwtService.sign as jest.Mock).mockReturnValue('signed-jwt');

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

    it('should propagate jwt signing errors', async () => {
      (jwtService.sign as jest.Mock).mockImplementation(() => {
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
  });
});
