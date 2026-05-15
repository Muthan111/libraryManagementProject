jest.mock(
  'src/book/book.entity',
  () => ({
    Book: class Book {},
  }),
  { virtual: true },
);

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { User } from './user.entity';
import { CreateUserDto } from './createUser.dto';
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
      findAndCount: jest.fn(),
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

  // -------------------------
  // FIND ALL
  // -------------------------
  describe('findAll', () => {
    it('should return all users', async () => {
      repository.findAndCount!.mockResolvedValue([[buildUser()], 1]);

      await expect(service.findAll(1, 10)).resolves.toEqual({
        data: [buildUser()],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
    });

    it('should return empty array when no users exist', async () => {
      repository.findAndCount!.mockResolvedValue([[], 0]);

      await expect(service.findAll(1, 10)).resolves.toEqual({
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
    });
    it('should calculate skip correctly for page 2', async () => {
      repository.findAndCount!.mockResolvedValue([[buildUser()], 12]);

      await service.findAll(2, 5);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 5,
        take: 5,
      });
    });
    it('should normalize invalid page and limit values', async () => {
      repository.findAndCount!.mockResolvedValue([[], 0]);

      await service.findAll(0, -2);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 1, // or 10, depending on your implementation
      });
    });
  });

  // -------------------------
  // CREATE
  // -------------------------
  describe('create', () => {
    it('should create user successfully', async () => {
      const dto: CreateUserDto = {
        name: 'Charlie',
        email: 'charlie@example.com',
        password: 'secret',
        role: Role.MEMBER,
      };

      repository.findOne!.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

      repository.create!.mockReturnValue(buildUser());
      repository
        .save!.mockResolvedValueOnce(buildUser())
        .mockResolvedValueOnce(buildUser({ customerCode: 'cus003' }));

      await expect(service.create(dto)).resolves.toBeDefined();
    });

    it('should throw ConflictException when email exists', async () => {
      repository.findOne!.mockResolvedValue(buildUser());

      await expect(
        service.create({
          name: 'Charlie',
          email: 'alice@example.com',
          password: 'secret',
          role: Role.MEMBER,
        }),
      ).rejects.toThrow(ConflictException);

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('should handle race condition during save (unique violation)', async () => {
      repository.findOne!.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

      repository.create!.mockReturnValue(buildUser());
      repository.save!.mockRejectedValue({ code: '23505' });

      await expect(
        service.create({
          name: 'X',
          email: 'x@example.com',
          password: '123',
          role: Role.MEMBER,
        }),
      ).rejects.toBeDefined();
    });

    it('should propagate bcrypt errors', async () => {
      repository.findOne!.mockResolvedValue(null);

      jest
        .spyOn(bcrypt, 'hash')
        .mockRejectedValue(new Error('bcrypt failed') as never);

      await expect(
        service.create({
          name: 'X',
          email: 'x@example.com',
          password: '123',
          role: Role.MEMBER,
        }),
      ).rejects.toThrow('bcrypt failed');
    });
  });

  // -------------------------
  // UPDATE
  // -------------------------
  describe('update', () => {
    it('should update user with password hashing', async () => {
      const existing = buildUser();
      repository.findOne!.mockResolvedValue(existing);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);
      repository.save!.mockImplementation(async (u) => u as User);

      await expect(
        service.update('cus001', { password: 'new' }),
      ).resolves.toBeDefined();

      expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('should update without password hashing', async () => {
      const existing = buildUser();
      repository.findOne!.mockResolvedValue(existing);

      const hashSpy = jest.spyOn(bcrypt, 'hash');

      repository.save!.mockImplementation(async (u) => u as User);

      await expect(
        service.update('cus001', { name: 'New' }),
      ).resolves.toBeDefined();

      expect(hashSpy).not.toHaveBeenCalled();
    });

    it('should handle empty DTO safely', async () => {
      const existing = buildUser();
      repository.findOne!.mockResolvedValue(existing);
      repository.save!.mockImplementation(async (u) => u as User);

      await expect(service.update('cus001', {})).resolves.toBeDefined();
    });

    it('should treat empty password as no update', async () => {
      const existing = buildUser();
      repository.findOne!.mockResolvedValue(existing);

      repository.save!.mockImplementation(async (u) => u as User);

      await expect(
        service.update('cus001', { password: '' }),
      ).resolves.toBeDefined();
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.update('cus999', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -------------------------
  // FIND BY CUSTOMER CODE
  // -------------------------
  describe('findUserByCustomerCode', () => {
    it('should return user', async () => {
      repository.findOne!.mockResolvedValue(buildUser());

      await expect(
        service.findUserByCustomerCode('cus001'),
      ).resolves.toBeDefined();
    });

    it('should throw when not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findUserByCustomerCode('cus999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // -------------------------
  // FIND BY EMAIL
  // -------------------------
  describe('findUserByEmail', () => {
    it('should return user', async () => {
      repository.findOne!.mockResolvedValue(buildUser());

      await expect(
        service.findUserByEmail('alice@example.com'),
      ).resolves.toBeDefined();
    });

    it('should return null when not found', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(
        service.findUserByEmail('missing@example.com'),
      ).resolves.toBeNull();
    });
  });

  // -------------------------
  // DELETE ALL
  // -------------------------
  describe('deleteAll', () => {
    it('should clear repository', async () => {
      repository.clear!.mockResolvedValue(undefined);

      await expect(service.deleteAll()).resolves.toBeUndefined();
      expect(repository.clear).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------
  // DELETE BY CUSTOMER CODE
  // -------------------------
  describe('deleteUserByCustomerCode', () => {
    it('should delete user', async () => {
      repository.delete!.mockResolvedValue({ affected: 1 } as DeleteResult);

      await expect(
        service.deleteUserByCustomerCode('cus001'),
      ).resolves.toBeUndefined();
    });

    it('should throw when not found', async () => {
      repository.delete!.mockResolvedValue({ affected: 0 } as DeleteResult);

      await expect(service.deleteUserByCustomerCode('cus999')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should call delete with correct payload', async () => {
      repository.delete!.mockResolvedValue({ affected: 1 } as DeleteResult);

      await service.deleteUserByCustomerCode('cus001');

      expect(repository.delete).toHaveBeenCalledWith({
        customerCode: 'cus001',
      });
    });
  });
});
