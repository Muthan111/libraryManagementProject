import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './createUser.dto';
import { UpdateUserDto } from './updateUser.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  findAll() {
    try{
      return this.userRepository.find();
    }
    catch(error){
      throw new NotFoundException("No users found");
    }
    
  }

  async create(userData: CreateUserDto) {
    try {
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
    catch {
      throw new NotFoundException("Error creating user")
    }
    
  }

  async update(id: number, userData: UpdateUserDto) {
    try {
      const existingUser = await this.userRepository.findOne({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const updatePayload = { ...userData };
    if (updatePayload.password) {
      updatePayload.password = await bcrypt.hash(updatePayload.password, 10);
    }

    Object.assign(existingUser, updatePayload);
    return this.userRepository.save(existingUser);
    }
    catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException("Error updating user")
    }
    
  }

  async findUserByCustomerCode(customerCode: string) {
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
    }
    catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException("Error finding user by customer code")
    }
    
  }

  async findUserByEmail(email: string) {
    try {
      const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (!existingUser) {
      return null;
    }

    return existingUser;
    }
    catch {
      throw new NotFoundException("Error finding user by email")
    }
    
  }

  async deleteAll() {
    const deleteResult: DeleteResult = await this.userRepository.delete({});

    return {
      message: `${deleteResult.affected ?? 0} users deleted successfully`,
    };
  }
  async testingRBAC(){
    return "Only admin can access this endpoint";
  }
}
