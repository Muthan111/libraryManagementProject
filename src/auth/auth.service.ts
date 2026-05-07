import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {

    // Injects user lookup and JWT utilities used during authentication.
    constructor(
        private readonly service: UserService,
        private readonly jwtService: JwtService
    ) { }

    // Validates user credentials and returns a sanitized user object on success.
    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.service.findUserByEmail(email);
        console.log('User found for email:', email, user); // Log the user found
        if (user && await bcrypt.compare(password, user.password)) {
            const { password, ...result } = user;
            console.log('Validated User:', result); // Log the validated user
            return result;
        }
        return null;
    }

    // Creates a signed JWT payload for an authenticated user.
    async login(user: any) {
        const payload = {
            
            sub: user.id,   // standard practice
            email: user.email,
            role: user.role, // include role in the payload
            
            
        };
        const token = this.jwtService.sign(payload);
        return {
            access_token: token,
        };
    }

    // Returns a simple success message for authenticated test requests.
    async testingAuthModule(){
        return "Hello You are Successfully Logged In"
    }
    // Returns a confirmation message for admin-only RBAC checks.
    async testingRBAC(){
    return "Only admin can access this endpoint";
  }
}
