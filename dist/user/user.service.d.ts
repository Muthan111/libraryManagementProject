import { Repository } from 'typeorm';
import { user } from "./user.entity";
export declare class UserService {
    private userRepository;
    constructor(userRepository: Repository<user>);
    findAll(): Promise<user[]>;
    create(userData: Partial<user>): Promise<user>;
}
