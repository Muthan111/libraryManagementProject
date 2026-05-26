jest.mock(
  'src/book/book.entity',
  () => ({
    Book: class Book {},
  }),
  { virtual: true },
);
jest.mock(
  'src/utils/code-generator',
  () => ({
    generateCode: jest.fn(),
  }),
  { virtual: true },
);
import { generateCode } from 'src/utils/code-generator';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getToken } from '@willsoto/nestjs-prometheus';
import {
  DataSource,
  DeleteResult,
  QueryFailedError,
  Repository,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Gauge } from 'prom-client';
import { UserService } from './user.service';
import { User } from './user.entity';
import { CreateUserDto } from './createUser.dto';
import { Role } from './user.enum';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Partial<Repository<User>>>;
  let httpErrorsCounter: { inc: jest.Mock };
  let httpRequestsCounter: { inc: jest.Mock };
  let userCreatedCounter: { inc: jest.Mock };
  let activeUsersGauge: Pick<Gauge<string>, 'set'>;

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

  let transactionRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  let manager: {
    getRepository: jest.Mock;
  };

  let dataSource: {
    transaction: jest.Mock;
  };

  beforeEach(async () => {
    (generateCode as jest.Mock).mockReset();

    httpErrorsCounter = {
      inc: jest.fn(),
    };

    httpRequestsCounter = {
      inc: jest.fn(),
    };

    userCreatedCounter = {
      inc: jest.fn(),
    };

    activeUsersGauge = {
      set: jest.fn(),
    };

    repository = {
      findAndCount: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    };

    transactionRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    manager = {
      getRepository: jest.fn().mockReturnValue(transactionRepository),
    };

    dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: getToken('http_errors_total'),
          useValue: httpErrorsCounter,
        },
        {
          provide: getToken('http_requests_total'),
          useValue: httpRequestsCounter,
        },
        {
          provide: getToken('user_created_total'),
          useValue: userCreatedCounter,
        },
        {
          provide: getToken('active_users'),
          useValue: activeUsersGauge,
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
      expect(httpRequestsCounter.inc).toHaveBeenCalledTimes(1);
      expect(activeUsersGauge.set).toHaveBeenCalledWith(1);
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
        take: 1,
      });
    });

    it('should cap limit at 100', async () => {
      repository.findAndCount!.mockResolvedValue([[], 0]);

      await service.findAll(1, 500);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 100,
      });
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      const dto: CreateUserDto = {
        name: 'Charlie',
        email: 'charlie@example.com',
        password: 'secret',
        role: Role.MEMBER,
      };
      const createdUser = buildUser({
        name: dto.name,
        email: dto.email,
        password: 'hashed-password',
        customerCode: 'CUS-ABCD-1234',
        role: dto.role,
      });

      transactionRepository.findOne.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
      (generateCode as jest.Mock).mockReturnValue('CUS-ABCD-1234');
      transactionRepository.create.mockReturnValue(createdUser);
      transactionRepository.save.mockResolvedValue(createdUser);

      await expect(service.create(dto)).resolves.toEqual(createdUser);

      expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
      expect(generateCode).toHaveBeenCalledWith('CUS-XXXX-####');
      expect(transactionRepository.create).toHaveBeenCalledWith({
        ...dto,
        password: 'hashed-password',
        customerCode: 'CUS-ABCD-1234',
      });
      expect(transactionRepository.save).toHaveBeenCalledTimes(1);
      expect(transactionRepository.save).toHaveBeenCalledWith(createdUser);
      expect(userCreatedCounter.inc).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException when email exists', async () => {
      transactionRepository.findOne.mockResolvedValue(buildUser());
      const hashSpy = jest.spyOn(bcrypt, 'hash');

      await expect(
        service.create({
          name: 'Charlie',
          email: 'alice@example.com',
          password: 'secret',
          role: Role.MEMBER,
        }),
      ).rejects.toThrow(ConflictException);

      expect(hashSpy).not.toHaveBeenCalled();
      expect(transactionRepository.create).not.toHaveBeenCalled();
      expect(transactionRepository.save).not.toHaveBeenCalled();
      expect(httpErrorsCounter.inc).toHaveBeenCalledTimes(1);
    });

    it('should propagate repository save errors', async () => {
      const dto: CreateUserDto = {
        name: 'X',
        email: 'x@example.com',
        password: '123',
        role: Role.MEMBER,
      };

      transactionRepository.findOne.mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);
      (generateCode as jest.Mock).mockReturnValue('CUS-TEST-1234');
      transactionRepository.create.mockReturnValue(buildUser());
      transactionRepository.save.mockRejectedValue(new Error('save failed'));

      await expect(service.create(dto)).rejects.toThrow('save failed');
      expect(httpErrorsCounter.inc).toHaveBeenCalledTimes(1);
    });

    it('should propagate bcrypt errors', async () => {
      transactionRepository.findOne.mockResolvedValue(null);

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
      expect(transactionRepository.create).not.toHaveBeenCalled();
      expect(transactionRepository.save).not.toHaveBeenCalled();
      expect(httpErrorsCounter.inc).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update user with password hashing', async () => {
      const updatedUser = buildUser({ password: 'hashed' });
      repository.update!.mockResolvedValue({ affected: 1 } as never);
      repository.findOne!.mockResolvedValue(updatedUser);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);

      await expect(
        service.update('cus001', { password: 'new' }),
      ).resolves.toEqual(updatedUser);

      expect(bcrypt.hash).toHaveBeenCalledWith('new', 10);
      expect(repository.update).toHaveBeenCalledWith(
        { customerCode: 'cus001' },
        { password: 'hashed' },
      );
    });

    it('should update without password hashing', async () => {
      const updatedUser = buildUser({ name: 'New' });
      repository.update!.mockResolvedValue({ affected: 1 } as never);
      repository.findOne!.mockResolvedValue(updatedUser);

      const hashSpy = jest.spyOn(bcrypt, 'hash');

      await expect(service.update('cus001', { name: 'New' })).resolves.toEqual(
        updatedUser,
      );

      expect(hashSpy).not.toHaveBeenCalled();
      expect(repository.update).toHaveBeenCalledWith(
        { customerCode: 'cus001' },
        { name: 'New' },
      );
    });

    it('should handle empty DTO safely', async () => {
      const existing = buildUser();
      repository.findOne!.mockResolvedValue(existing);

      await expect(service.update('cus001', {})).resolves.toEqual(existing);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should reject empty password', async () => {
      await expect(service.update('cus001', { password: '' })).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.update).not.toHaveBeenCalled();
      expect(httpErrorsCounter.inc).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.update!.mockResolvedValue({ affected: 0 } as never);

      await expect(service.update('cus999', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should map duplicate email errors to ConflictException', async () => {
      repository.update!.mockRejectedValue(
        new QueryFailedError('UPDATE user', [], {
          code: 'ER_DUP_ENTRY',
        } as any),
      );

      await expect(
        service.update('cus001', { email: 'alice@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

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
      expect(httpErrorsCounter.inc).toHaveBeenCalledTimes(1);
    });
  });

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
      expect(httpErrorsCounter.inc).toHaveBeenCalledTimes(1);
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
