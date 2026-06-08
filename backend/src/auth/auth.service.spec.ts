import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Gauge } from 'prom-client';
import { Role } from '../user/user.enum';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: Pick<JwtService, 'sign'>;
  let userRepository: { findOne: jest.Mock };
  let authRequestsCounter: { inc: jest.Mock };
  let authFailuresCounter: { inc: jest.Mock };
  let activeUsersGauge: Pick<Gauge<string>, 'inc'>;

  beforeEach(() => {
    jwtService = {
      sign: jest.fn(),
    };

    userRepository = {
      findOne: jest.fn(),
    };

    authRequestsCounter = { inc: jest.fn() };
    authFailuresCounter = { inc: jest.fn() };
    activeUsersGauge = { inc: jest.fn() };

    service = new AuthService(
      userRepository as any,
      jwtService as JwtService,
      authRequestsCounter as any,
      authFailuresCounter as any,
      activeUsersGauge as any,
    );
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
        name: 'Alice',
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
      expect(authRequestsCounter.inc).toHaveBeenCalledTimes(1);
      expect(activeUsersGauge.inc).toHaveBeenCalledTimes(1);
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
      expect(authFailuresCounter.inc).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when the user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.validateUser('missing@example.com', 'plain-password'),
      ).rejects.toThrow(new UnauthorizedException('Invalid credentials'));
      expect(authFailuresCounter.inc).toHaveBeenCalledTimes(1);
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
      expect(authFailuresCounter.inc).toHaveBeenCalledTimes(1);
    });
  });

  describe('login', () => {
    it('should sign and return an access token', async () => {
      (jwtService.sign as jest.Mock).mockReturnValue('signed-jwt');

      await expect(
        service.login({
          id: 7,
          name: 'Login User',
          customerCode: 'CUST-WSDC-1234',
          email: 'login@example.com',
          role: Role.ADMIN,
        }),
      ).resolves.toEqual({
        access_token: 'signed-jwt',
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 7,
        name: 'Login User',
        customerCode: 'CUST-WSDC-1234',
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
          name: 'Test User',
          customerCode: 'CUST-WSDC-1234',
          email: 'test@test.com',
          role: Role.ADMIN,
        }),
      ).rejects.toThrow('JWT failed');
    });
  });
});
