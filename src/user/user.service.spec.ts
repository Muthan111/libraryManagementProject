jest.mock('src/book/book.entity', () => ({
  Book: class Book {},
}), { virtual: true });

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { User } from './user.entity';
import { CreateUserDto } from './createUser.dto';
import { UpdateUserDto } from './updateUser.dto';
import { Role } from './user.enum';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Partial<Repository<User>>>;

  const buildUser = (overrides: Partial<User> = {}): User => ({
    id: 1,
    customerCode: 'cus001',
    name: 'Alice',
    email: 'alice@example.com',
    password: 'alice-secret',
    borrowRecords: [],
    role: Role.MEMBER,
    ...overrides,
  });

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users from the repository', async () => {
      const users = [
        buildUser(),
        buildUser({
          id: 2,
          customerCode: 'cus002',
          name: 'Bob',
          email: 'bob@example.com',
          password: 'bob-secret',
          role: Role.ADMIN,
        }),
      ];

      repository.find!.mockResolvedValue(users);

      await expect(service.findAll()).resolves.toEqual(users);
      expect(repository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should hash the password, generate the customer code, and save twice', async () => {
      const userData: CreateUserDto = {
        name: 'Charlie',
        email: 'charlie@example.com',
        password: 'charlie-secret',
        role: Role.MEMBER,
      };
      const hashedPassword = 'hashed-charlie-secret';
      const createdUserWithoutCode = buildUser({
        id: 3,
        customerCode: undefined,
        name: 'Charlie',
        email: 'charlie@example.com',
        password: hashedPassword,
      });
      const createdUser = buildUser({
        id: 3,
        customerCode: 'cus003',
        name: 'Charlie',
        email: 'charlie@example.com',
        password: hashedPassword,
      });

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      repository.create!.mockReturnValue(createdUserWithoutCode);
      repository.save!
        .mockResolvedValueOnce(createdUserWithoutCode)
        .mockResolvedValueOnce(createdUser);

      await expect(service.create(userData)).resolves.toEqual(createdUser);
      expect(bcrypt.hash).toHaveBeenCalledWith('charlie-secret', 10);
      expect(repository.create).toHaveBeenCalledWith({
        ...userData,
        password: hashedPassword,
      });
      expect(repository.save).toHaveBeenNthCalledWith(1, createdUserWithoutCode);
      expect(repository.save).toHaveBeenNthCalledWith(2, {
        ...createdUserWithoutCode,
        customerCode: 'cus003',
      });
    });

    it('should throw when creating a user with an email that already exists', async () => {
      const userData: CreateUserDto = {
        name: 'Charlie',
        email: 'charlie@example.com',
        password: 'charlie-secret',
        role: Role.MEMBER,
      };
      const existingUser = buildUser({
        id: 3,
        customerCode: 'cus003',
        name: 'Charlie',
        email: 'charlie@example.com',
      });

      const hashSpy = jest.spyOn(bcrypt, 'hash');
      repository.findOne!.mockResolvedValue(existingUser);

      await expect(service.create(userData)).rejects.toThrow(
        new ConflictException('User with email charlie@example.com already exists'),
      );
      expect(hashSpy).not.toHaveBeenCalled();
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should merge incoming data, hash a new password, and save the user', async () => {
      const existingUser = buildUser({
        id: 4,
        customerCode: 'cus004',
        name: 'Diana',
        email: 'diana@example.com',
        password: 'old-secret',
      });
      const updateData: UpdateUserDto = {
        name: 'Diana Prince',
        password: 'new-secret',
      };
      const hashedPassword = 'hashed-new-secret';

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      repository.findOne!.mockResolvedValue(existingUser);
      repository.save!.mockImplementation(async (user) => user as User);

      await expect(service.update(4, updateData)).resolves.toEqual({
        ...existingUser,
        name: 'Diana Prince',
        password: hashedPassword,
      });
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 4 } });
      expect(bcrypt.hash).toHaveBeenCalledWith('new-secret', 10);
      expect(repository.save).toHaveBeenCalledWith({
        ...existingUser,
        name: 'Diana Prince',
        password: hashedPassword,
      });
    });

    it('should save without hashing when the password is not being updated', async () => {
      const existingUser = buildUser({
        id: 6,
        customerCode: 'cus006',
        name: 'Frank',
        email: 'frank@example.com',
      });
      const updateData: UpdateUserDto = {
        email: 'frank.updated@example.com',
      };

      const hashSpy = jest.spyOn(bcrypt, 'hash');
      repository.findOne!.mockResolvedValue(existingUser);
      repository.save!.mockImplementation(async (user) => user as User);

      await expect(service.update(6, updateData)).resolves.toEqual({
        ...existingUser,
        email: 'frank.updated@example.com',
      });
      expect(hashSpy).not.toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith({
        ...existingUser,
        email: 'frank.updated@example.com',
      });
    });

    it('should throw when trying to update a missing user', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.update(99, { name: 'Missing User' })).rejects.toThrow(
        new NotFoundException('User with id 99 not found'),
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findUserByCustomerCode', () => {
    it('should return the matching user', async () => {
      const existingUser = buildUser({
        id: 5,
        customerCode: 'cus005',
        name: 'Evan',
        email: 'evan@example.com',
        password: 'evan-secret',
      });

      repository.findOne!.mockResolvedValue(existingUser);

      await expect(service.findUserByCustomerCode('cus005')).resolves.toEqual(
        existingUser,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { customerCode: 'cus005' },
      });
    });

    it('should throw when the customer code does not exist', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findUserByCustomerCode('cus999')).rejects.toThrow(
        new NotFoundException('User with customer code cus999 not found'),
      );
    });
  });

  describe('findUserByEmail', () => {
    it('should return the matching user', async () => {
      const existingUser = buildUser({
        email: 'grace@example.com',
      });

      repository.findOne!.mockResolvedValue(existingUser);

      await expect(service.findUserByEmail('grace@example.com')).resolves.toEqual(
        existingUser,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { email: 'grace@example.com' },
      });
    });

    it('should return null when the email does not exist', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findUserByEmail('missing@example.com')).resolves.toBe(
        null,
      );
    });
  });

  describe('deleteAll', () => {
    it('should clear all users from the repository', async () => {
      repository.clear!.mockResolvedValue(undefined);

      await expect(service.deleteAll()).resolves.toBeUndefined();
      expect(repository.clear).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteUserByCustomerCode', () => {
    it('should delete the user when the customer code exists', async () => {
      repository.delete!.mockResolvedValue({ affected: 1 } as DeleteResult);

      await expect(service.deleteUserByCustomerCode('cus001')).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith({
        customerCode: 'cus001',
      });
    });

    it('should throw when the customer code does not exist', async () => {
      repository.delete!.mockResolvedValue({ affected: 0 } as DeleteResult);

      await expect(service.deleteUserByCustomerCode('cus999')).rejects.toThrow(
        new NotFoundException('User with customer code cus999 not found'),
      );
    });
  });

});
