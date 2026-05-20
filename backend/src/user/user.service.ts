import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  DeleteResult,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './createUser.dto';
import { UpdateUserDto } from './updateUser.dto';
import * as bcrypt from 'bcrypt';
import { generateCode } from 'src/utils/code-generator';

@Injectable()
// BUG: ❗ inconsistent ID usage vs customerCode usage
export class UserService {
  // Injects the repository used for all user persistence operations.
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  // Returns every user currently stored in the database.
  async findAll(page = 1, limit = 10) {
    const validPage = Math.max(page, 1);
    const validLimit = Math.min(Math.max(limit, 1), 100);
    const [users, total] = await this.userRepository.findAndCount({
      skip: (validPage - 1) * validLimit,
      take: validLimit,
    });
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
  }

  // Creates a user, prevents duplicate emails, and stores a hashed password.
  async create(userData: CreateUserDto) {
    // BUG: 10. Missing transaction safety in create()
    // BUG:Unsafe two-step user creation (race condition)
    // TODO: FIX: Add DB-level unique constraint:
    try {
      return this.dataSource.transaction(async (manager) => {
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

        const user = userRepository.create({
          ...userData,
          password: hashedPassword,
          customerCode,
        });

        return await userRepository.save(user);
      });
    } catch (error) {
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
    // BUG: update() uses find + save (not optimal)
    // Problem:extra SELECT query, not atomic

    const existingUser = await this.userRepository.findOne({
      where: { customerCode },
    });
    console.log('Existing User:', existingUser);

    if (!existingUser) {
      throw new NotFoundException(`User with id ${customerCode} not found`);
    }
    // BUG: ❗ Password update logic is correct but incomplete
    const updatePayload = { ...userData };
    if (updatePayload.password) {
      updatePayload.password = await bcrypt.hash(updatePayload.password, 10);
    }

    Object.assign(existingUser, updatePayload);
    return this.userRepository.save(existingUser);
  }

  // Finds a user by customer code and throws when no matching user exists.
  async findUserByCustomerCode(customerCode: string) {
    const existingUser = await this.userRepository.findOne({
      where: { customerCode },
    });

    if (!existingUser) {
      throw new NotFoundException(
        `User with customer code ${customerCode} not found`,
      );
    }

    return existingUser;
  }

  // Finds a user by email for authentication workflows.
  async findUserByEmail(email: string) {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (!existingUser) {
      // BUG: findUserByEmail returns null inconsistently
      // TODO: CHOOSE A CONSISTENT APPROACH:
      return null;
    }

    return existingUser;
  }

  // Deletes every user record from the database.
  // BUG: deleteAll() is dangerous in production
  async deleteAll() {
    return await this.userRepository.clear();
  }
  // Deletes a single user using their customer code.
  async deleteUserByCustomerCode(customerCode: string) {
    const deleteResult: DeleteResult = await this.userRepository.delete({
      customerCode,
    });
    if (deleteResult.affected === 0) {
      throw new NotFoundException(
        `User with customer code ${customerCode} not found`,
      );
    }
  }
}
