import { UserService } from "./user.service";
import { CreateUserDto } from "./createUser.dto";
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    findAllUsers(): Promise<import("./user.entity").user[]>;
    createUser(data: CreateUserDto): Promise<import("./user.entity").user>;
}
