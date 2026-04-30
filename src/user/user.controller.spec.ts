import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from './createUser.dto';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UpdateUserDto } from './updateUser.dto';

describe('UserController', () => {
  let controller: UserController;
  let service: {
    findAll: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    findUserByCustomerCode: jest.Mock;
    deleteAll: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUserByCustomerCode: jest.fn(),
      deleteAll: jest.fn(),
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
      };
      const createdUser = {
        id: 2,
        customerCode: 'cus002',
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
});
