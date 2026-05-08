jest.mock(
  'src/book/book.entity',
  () => ({
    Book: class Book {},
  }),
  { virtual: true },
);

import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './createUser.dto';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UpdateUserDto } from './updateUser.dto';
import { Role } from './user.enum';

describe('UserController', () => {
  let controller: UserController;
  let service: {
    findAll: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    findUserByCustomerCode: jest.Mock;
    deleteAll: jest.Mock;
    deleteUserByCustomerCode: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUserByCustomerCode: jest.fn(),
      deleteAll: jest.fn(),
      deleteUserByCustomerCode: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // -------------------------
  // FIND ALL
  // -------------------------
  describe('findAllUsers', () => {
    it('should return all users', async () => {
      const users = [
        {
          id: 1,
          customerCode: 'cus001',
          name: 'Alice',
          email: 'alice@example.com',
          password: 'secret',
          borrowRecords: [],
          role: Role.MEMBER,
        },
      ];

      service.findAll.mockResolvedValue(users);

      await expect(controller.findAllUsers()).resolves.toEqual(users);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('should propagate service errors', async () => {
      service.findAll.mockRejectedValue(new Error('DB crash'));

      await expect(controller.findAllUsers()).rejects.toThrow('DB crash');
    });
  });

  // -------------------------
  // CREATE
  // -------------------------
  describe('createUser', () => {
    it('should pass dto to service', async () => {
      const dto: CreateUserDto = {
        name: 'Bob',
        email: 'bob@example.com',
        password: 'secret',
        role: Role.ADMIN,
      };

      const created = {
        id: 2,
        customerCode: 'cus002',
        borrowRecords: [],
        ...dto,
      };

      service.create.mockResolvedValue(created);

      await expect(controller.createUser(dto)).resolves.toEqual(created);
      expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('should not mutate dto', async () => {
      const dto: CreateUserDto = {
        name: 'Bob',
        email: 'bob@example.com',
        password: 'secret',
        role: Role.ADMIN,
      };

      const copy = { ...dto };

      service.create.mockResolvedValue({});

      await controller.createUser(dto);

      expect(dto).toEqual(copy);
    });

    it('should propagate service errors', async () => {
      const dto: CreateUserDto = {
        name: 'Bob',
        email: 'bob@example.com',
        password: 'secret',
        role: Role.ADMIN,
      };

      service.create.mockRejectedValue(new Error('Create failed'));

      await expect(controller.createUser(dto)).rejects.toThrow('Create failed');
    });
  });

  // -------------------------
  // FIND BY CODE
  // -------------------------
  describe('findUserByCustomerCode', () => {
    it('should return user', async () => {
      const user = {
        id: 3,
        customerCode: 'cus003',
        name: 'Charlie',
        email: 'charlie@example.com',
        password: 'secret',
        borrowRecords: [],
        role: Role.MEMBER,
      };

      service.findUserByCustomerCode.mockResolvedValue(user);

      await expect(
        controller.findUserByCustomerCode('cus003'),
      ).resolves.toEqual(user);
      expect(service.findUserByCustomerCode).toHaveBeenCalledWith('cus003');
    });

    it('should handle empty customer code', async () => {
      service.findUserByCustomerCode.mockResolvedValue(null);

      await expect(controller.findUserByCustomerCode('')).resolves.toBeNull();
    });

    it('should propagate errors', async () => {
      service.findUserByCustomerCode.mockRejectedValue(new Error('Not found'));

      await expect(controller.findUserByCustomerCode('x')).rejects.toThrow(
        'Not found',
      );
    });
  });

  // -------------------------
  // UPDATE
  // -------------------------
  describe('updateUser', () => {
    it('should update user', async () => {
      const dto: UpdateUserDto = {
        name: 'Updated',
        email: 'updated@example.com',
      };

      const updated = {
        id: 4,
        customerCode: 'cus004',
        name: 'Updated',
        email: 'updated@example.com',
        password: 'secret',
        borrowRecords: [],
        role: Role.MEMBER,
      };

      service.update.mockResolvedValue(updated);

      await expect(controller.updateUser('cus004', dto)).resolves.toEqual(
        updated,
      );
      expect(service.update).toHaveBeenCalledWith('cus004', dto);
    });

    it('should handle empty update payload', async () => {
      service.update.mockResolvedValue({
        id: 4,
        customerCode: 'cus004',
      });

      await expect(controller.updateUser('cus004', {})).resolves.toEqual({
        id: 4,
        customerCode: 'cus004',
      });
    });

    it('should propagate errors', async () => {
      service.update.mockRejectedValue(new Error('Update failed'));

      await expect(controller.updateUser('cus004', {})).rejects.toThrow(
        'Update failed',
      );
    });
  });

  // -------------------------
  // DELETE ALL
  // -------------------------
  describe('deleteAllUsers', () => {
    it('should call service', async () => {
      service.deleteAll.mockResolvedValue(undefined);

      await expect(controller.deleteAllUsers()).resolves.toBeUndefined();
      expect(service.deleteAll).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors', async () => {
      service.deleteAll.mockRejectedValue(new Error('Delete all failed'));

      await expect(controller.deleteAllUsers()).rejects.toThrow(
        'Delete all failed',
      );
    });
  });

  // -------------------------
  // DELETE BY CODE
  // -------------------------
  describe('deleteUserByCustomerCode', () => {
    it('should call service with code', async () => {
      service.deleteUserByCustomerCode.mockResolvedValue(undefined);

      await expect(
        controller.deleteUserByCustomerCode('cus007'),
      ).resolves.toBeUndefined();
      expect(service.deleteUserByCustomerCode).toHaveBeenCalledWith('cus007');
    });

    it('should propagate errors', async () => {
      service.deleteUserByCustomerCode.mockRejectedValue(
        new Error('Delete failed'),
      );

      await expect(
        controller.deleteUserByCustomerCode('cus007'),
      ).rejects.toThrow('Delete failed');
    });
  });
});
