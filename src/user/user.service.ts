import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { user } from "./user.entity"
@Injectable()
export class UserService {
    constructor(@InjectRepository(user)
    private userRepository: Repository<user>,
) {}
    findAll() {
    return this.userRepository.find();
  }

  async create(userData: Partial<user>) {
    const user1 = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user1);

    savedUser.customerCode = `cus${savedUser.id.toString().padStart(3, '0')}`;
    return this.userRepository.save(savedUser);
  }
}
