import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { user } from './user.entity';
import { CreateUserDto } from './createUser.dto';
import { UpdateUserDto } from './updateUser.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(user)
    private userRepository: Repository<user>,
  ) {}

  findAll() {
    return this.userRepository.find();
  }

  async create(userData: CreateUserDto) {
    const user1 = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user1);

    savedUser.customerCode = `cus${savedUser.id.toString().padStart(3, '0')}`;
    return this.userRepository.save(savedUser);
  }

  async update(id: number, userData: UpdateUserDto) {
    const existingUser = await this.userRepository.findOne({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    Object.assign(existingUser, userData);
    return this.userRepository.save(existingUser);
  }

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

  async deleteAll() {
    const deleteResult: DeleteResult = await this.userRepository.delete({});

    return {
      message: `${deleteResult.affected ?? 0} users deleted successfully`,
    };
  }
}
