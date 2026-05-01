import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { UserService } from './user.service';
import { user } from './user.entity';
import { CreateUserDto } from './createUser.dto';
import { UpdateUserDto } from './updateUser.dto';
import * as bcrypt from 'bcrypt';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Partial<Repository<user>>>;

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(user),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all users from the repository', async () => {
      const users: user[] = [
        { id: 1, customerCode: 'cus001', name: 'Alice', email: 'alice@example.com', password: 'alice-secret' },
        { id: 2, customerCode: 'cus002', name: 'Bob', email: 'bob@example.com', password: 'bob-secret' },
      ];

      repository.find!.mockResolvedValue(users);

      await expect(service.findAll()).resolves.toEqual(users);
      expect(repository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should create a user entity, generate the customer code, and save it twice', async () => {
      const userData: CreateUserDto = {
        name: 'Charlie',
        email: 'charlie@example.com',
        password: 'charlie-secret',
      };
      const hashedPassword = 'hashed-charlie-secret';
      const createdUser: user = {
        id: 3,
        customerCode: 'cus003',
        name: 'Charlie',
        email: 'charlie@example.com',
        password: hashedPassword,
      };
      const createdUserWithoutCode: user = {
        id: 3,
        customerCode: undefined,
        name: 'Charlie',
        email: 'charlie@example.com',
        password: hashedPassword,
      };

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      repository.create!.mockReturnValue(createdUserWithoutCode);
      repository.save!
        .mockResolvedValueOnce(createdUserWithoutCode)
        .mockResolvedValueOnce(createdUser);

      await expect(service.create(userData)).resolves.toEqual(createdUser);
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
  });

  describe('update', () => {
    it('should merge the incoming data into the existing user and save it', async () => {
      const existingUser: user = {
        id: 4,
        customerCode: 'cus004',
        name: 'Diana',
        email: 'diana@example.com',
        password: 'old-secret',
      };
      const updateData: UpdateUserDto = {
        name: 'Diana Prince',
        password: 'new-secret',
      };
      const hashedPassword = 'hashed-new-secret';
      const updatedUser: user = {
        ...existingUser,
        ...updateData,
        password: hashedPassword,
      };

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword as never);
      repository.findOne!.mockResolvedValue(existingUser);
      repository.save!.mockResolvedValue(updatedUser);

      await expect(service.update(4, updateData)).resolves.toEqual(updatedUser);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 4 } });
      expect(repository.save).toHaveBeenCalledWith(updatedUser);
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
      const existingUser: user = {
        id: 5,
        customerCode: 'cus005',
        name: 'Evan',
        email: 'evan@example.com',
        password: 'evan-secret',
      };

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

  describe('deleteAll', () => {
    it('should delete all users and return the deleted count', async () => {
      repository.delete!.mockResolvedValue({ affected: 3 } as DeleteResult);

      await expect(service.deleteAll()).resolves.toEqual({
        message: '3 users deleted successfully',
      });
      expect(repository.delete).toHaveBeenCalledWith({});
    });

    it('should still return a success message when there are no users to delete', async () => {
      repository.delete!.mockResolvedValue({ affected: 0 } as DeleteResult);

      await expect(service.deleteAll()).resolves.toEqual({
        message: '0 users deleted successfully',
      });
    });
  });
});
