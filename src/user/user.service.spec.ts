import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { user } from './user.entity';

describe('UserService', () => {
  let service: UserService;
  let repository: jest.Mocked<Partial<Repository<user>>>;

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
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
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' },
      ];

      repository.find!.mockResolvedValue(users);

      await expect(service.findAll()).resolves.toEqual(users);
      expect(repository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should create a user entity and save it', async () => {
      const userData: Partial<user> = {
        name: 'Charlie',
        email: 'charlie@example.com',
      };
      const createdUser: user = {
        id: 3,
        name: 'Charlie',
        email: 'charlie@example.com',
      };

      repository.create!.mockReturnValue(createdUser);
      repository.save!.mockResolvedValue(createdUser);

      await expect(service.create(userData)).resolves.toEqual(createdUser);
      expect(repository.create).toHaveBeenCalledWith(userData);
      expect(repository.save).toHaveBeenCalledWith(createdUser);
    });
  });
});
