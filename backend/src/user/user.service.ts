import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import * as bcrypt from 'bcrypt';
import { Counter, Gauge } from 'prom-client';
import { generateCode } from 'src/utils/code-generator';
import {
  DataSource,
  DeleteResult,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { CreateUserDto } from './createUser.dto';
import { UpdateUserDto } from './updateUser.dto';
import { User } from './user.entity';

@Injectable()
// BUG: inconsistent ID usage vs customerCode usage
export class UserService {
  // Injects the repository used for all user persistence operations.
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    @InjectMetric('http_errors_total')
    private readonly httpErrorsCounter: Counter<string>,
    @InjectMetric('http_requests_total')
    private readonly httpRequestsCounter: Counter<string>,
    @InjectMetric('user_created_total')
    private readonly userCreatedCounter: Counter<string>,
    @InjectMetric('active_users')
    private readonly activeUsersGauge: Gauge<string>,
  ) {}

  // Returns every user currently stored in the database.
  async findAll(page = 1, limit = 10) {
    this.httpRequestsCounter.inc();

    try {
      const validPage = Math.max(page, 1);
      const validLimit = Math.min(Math.max(limit, 1), 100);
      const [users, total] = await this.userRepository.findAndCount({
        skip: (validPage - 1) * validLimit,
        take: validLimit,
      });

      this.activeUsersGauge.set(total);
      console.log('Finding all users');

      return {
        data: users,
        meta: {
          page: validPage,
          limit: validLimit,
          total,
          totalPages: Math.ceil(total / validLimit),
        },
      };
    } catch (error) {
      this.httpErrorsCounter.inc();
      throw error;
    }
  }

  // Creates a user, prevents duplicate emails, and stores a hashed password.
  async create(userData: CreateUserDto) {
    this.httpRequestsCounter.inc();

    try {
      const user = await this.dataSource.transaction(async (manager) => {
        const userRepository = manager.getRepository(User);

        const existingUser = await userRepository.findOne({
          where: { email: userData.email },
        });

        if (existingUser) {
          throw new ConflictException(
            `User with email ${userData.email} already exists`,
          );
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const customerCode = generateCode('CUS-XXXX-####');

        const createdUser = userRepository.create({
          ...userData,
          password: hashedPassword,
          customerCode,
        });

        return await userRepository.save(createdUser);
      });

      this.userCreatedCounter.inc();
      return user;
    } catch (error) {
      this.httpErrorsCounter.inc();

      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          `User with email ${userData.email} already exists`,
        );
      }

      throw error;
    }
  }

  // Updates a user by customer code, hashing a new password when provided.
  async update(customerCode: string, userData: UpdateUserDto) {
    this.httpRequestsCounter.inc();

    try {
      const updatePayload: Partial<User> = {};

      if (userData.name !== undefined) {
        updatePayload.name = userData.name;
      }

      if (userData.email !== undefined) {
        updatePayload.email = userData.email;
      }

      if (userData.password !== undefined) {
        if (userData.password.trim() === '') {
          throw new BadRequestException('Password cannot be empty');
        }

        updatePayload.password = await bcrypt.hash(userData.password, 10);
      }

      if (Object.keys(updatePayload).length === 0) {
        return this.findUserByCustomerCode(customerCode);
      }

      const result = await this.userRepository.update(
        { customerCode },
        updatePayload,
      );

      if (result.affected === 0) {
        throw new NotFoundException(
          `User with customer code ${customerCode} not found`,
        );
      }

      return this.findUserByCustomerCode(customerCode);
    } catch (error) {
      this.httpErrorsCounter.inc();

      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException('User update violates a unique constraint');
      }

      throw error;
    }
  }

  // Finds a user by customer code and throws when no matching user exists.
  async findUserByCustomerCode(customerCode: string) {
    this.httpRequestsCounter.inc();

    try {
      const existingUser = await this.userRepository.findOne({
        where: { customerCode },
      });

      if (!existingUser) {
        throw new NotFoundException(
          `User with customer code ${customerCode} not found`,
        );
      }

      return existingUser;
    } catch (error) {
      this.httpErrorsCounter.inc();
      throw error;
    }
  }

  // Finds a user by email for authentication workflows.
  async findUserByEmail(email: string) {
    this.httpRequestsCounter.inc();

    try {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (!existingUser) {
        // BUG: findUserByEmail returns null inconsistently
        // TODO: CHOOSE A CONSISTENT APPROACH:
        return null;
      }

      return existingUser;
    } catch (error) {
      this.httpErrorsCounter.inc();
      throw error;
    }
  }

  // Deletes a single user using their customer code.
  async deleteUserByCustomerCode(customerCode: string) {
    this.httpRequestsCounter.inc();

    try {
      const deleteResult: DeleteResult = await this.userRepository.delete({
        customerCode,
      });

      if (deleteResult.affected === 0) {
        throw new NotFoundException(
          `User with customer code ${customerCode} not found`,
        );
      }
    } catch (error) {
      this.httpErrorsCounter.inc();
      throw error;
    }
  }
}
