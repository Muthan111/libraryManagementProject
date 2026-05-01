import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {

    constructor(
        private readonly service: UserService,
        private readonly jwtService: JwtService
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.service.findUserByEmail(email);
        if (user && await bcrypt.compare(password, user.password)) {
            const { password, ...result } = user;
            console.log('Validated User:', result); // Log the validated user
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = {
            
            sub: user.id,   // standard practice
            email: user.email
            
            
        };
        const token = this.jwtService.sign(payload);
        return {
            access_token: token,
        };
    }

    async testingAuthModule(){
        return "Hello You are Successfully Logged In"
    }
}
