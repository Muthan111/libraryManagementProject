import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import {user} from "./user.entity"
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [TypeOrmModule.forFeature([user])],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule {}
