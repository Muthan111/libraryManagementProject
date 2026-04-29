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

  create(userData: Partial<user>) {
    const user1 = this.userRepository.create(userData);
    return this.userRepository.save(user1);
  }
}
