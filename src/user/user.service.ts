import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './createUser.dto';
import { UpdateUserDto } from './updateUser.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  // Injects the repository used for all user persistence operations.
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Returns every user currently stored in the database.
  findAll() {
    return this.userRepository.find();
    
    
  }

  // Creates a user, prevents duplicate emails, and stores a hashed password.
  async create(userData: CreateUserDto) {
    const existingUser = await this.userRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new ConflictException(
          `User with email ${userData.email} already exists`,
        );
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.userRepository.create({
    ...userData,
    password: hashedPassword,
  });
    const savedUser = await this.userRepository.save(user);
    savedUser.customerCode = `cus${savedUser.id.toString().padStart(3, '0')}`;
    const final = await this.userRepository.save(savedUser);
    return final;
    
    
  }

  // Updates a user by customer code, hashing a new password when provided.
  async update(customerCode: string, userData: UpdateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { customerCode },
    });
    console.log("Existing User:", existingUser);

    if (!existingUser) {
      throw new NotFoundException(`User with id ${customerCode} not found`);
    }

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
      return null;
    }

    return existingUser;
    
    
  }

  // Deletes every user record from the database.
  async deleteAll() {
    return await this.userRepository.clear();

    
  }
  // Deletes a single user using their customer code.
  async deleteUserByCustomerCode(customerCode: string) {
    const deleteResult: DeleteResult = await this.userRepository.delete({
      customerCode,
    })
    if (deleteResult.affected === 0) {
      throw new NotFoundException(
        `User with customer code ${customerCode} not found`,
      );
    }
   
  }

}
