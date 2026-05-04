jest.mock('src/book/book.entity', () => ({
  Book: class Book {},
}), { virtual: true });

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
    testingRBAC: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUserByCustomerCode: jest.fn(),
      deleteAll: jest.fn(),
      testingRBAC: jest.fn(),
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

  describe('findAllUsers', () => {
    it('should return all users from the service', async () => {
      const users = [
        {
          id: 1,
          customerCode: 'cus001',
          name: 'Alice',
          email: 'alice@example.com',
          password: 'alice-secret',
          borrowedBooks: [],
          role: Role.MEMBER,
        },
      ];

      service.findAll.mockResolvedValue(users);

      await expect(controller.findAllUsers()).resolves.toEqual(users);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('createUser', () => {
    it('should pass the dto to the service', async () => {
      const dto: CreateUserDto = {
        name: 'Bob',
        email: 'bob@example.com',
        password: 'bob-secret',
        role: Role.ADMIN,
      };
      const createdUser = {
        id: 2,
        customerCode: 'cus002',
        borrowedBooks: [],
        ...dto,
      };

      service.create.mockResolvedValue(createdUser);

      await expect(controller.createUser(dto)).resolves.toEqual(createdUser);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findUserByCustomerCode', () => {
    it('should pass the customer code to the service', async () => {
      const foundUser = {
        id: 3,
        customerCode: 'cus003',
        name: 'Charlie',
        email: 'charlie@example.com',
        password: 'charlie-secret',
        borrowedBooks: [],
        role: Role.MEMBER,
      };

      service.findUserByCustomerCode.mockResolvedValue(foundUser);

      await expect(controller.findUserByCustomerCode('cus003')).resolves.toEqual(
        foundUser,
      );
      expect(service.findUserByCustomerCode).toHaveBeenCalledWith('cus003');
    });
  });

  describe('updateUser', () => {
    it('should convert the id to a number and pass update data to the service', async () => {
      const dto: UpdateUserDto = {
        name: 'Updated Name',
        email: 'updated@example.com',
      };
      const updatedUser = {
        id: 4,
        customerCode: 'cus004',
        name: 'Updated Name',
        email: 'updated@example.com',
        password: 'diana-secret',
        borrowedBooks: [],
        role: Role.MEMBER,
      };

      service.update.mockResolvedValue(updatedUser);

      await expect(controller.updateUser('4', dto)).resolves.toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith(4, dto);
    });
  });

  describe('deleteAllUsers', () => {
    it('should delegate to the service', async () => {
      const result = {
        message: '2 users deleted successfully',
      };

      service.deleteAll.mockResolvedValue(result);

      await expect(controller.deleteAllUsers()).resolves.toEqual(result);
      expect(service.deleteAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('testingRBAC', () => {
    it('should delegate to the service', async () => {
      service.testingRBAC.mockResolvedValue(
        'Only admin can access this endpoint',
      );

      await expect(controller.testingRBAC()).resolves.toBe(
        'Only admin can access this endpoint',
      );
      expect(service.testingRBAC).toHaveBeenCalledTimes(1);
    });
  });
});
