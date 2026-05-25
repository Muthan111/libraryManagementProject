import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from 'src/user/user.entity';
import { AuthUser } from './authType';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
@Injectable()
// ❗ No rate limiting / brute-force protection logic- Implemented as a global level
export class AuthService {
  // Injects user lookup and JWT utilities used during authentication.
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  // Validates user credentials and returns a sanitized user object on success.
  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    // BUG: You are logging sensitive user authentication data -solved
    // BUG: ❗ validateUser returns inconsistent type (any + null)
    // BUG: ❗ Returning full user object then deleting password is unsafe pattern
    // BUG: ❗ Missing guard against null password hashing edge cases
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // BUG: ❗ bcrypt compare is correct but unoptimized
    const final = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return final;
    // BUG: ❗ validateUser should NOT return null silently -solved
  }

  // Creates a signed JWT payload for an authenticated user.
  async login(user: AuthUser) {
    // BUG:❗ JWT payload uses sub correctly BUT lacks expiration control here
    const payload = {
      sub: user.id, // standard practice
      email: user.email,
      role: user.role, // include role in the payload
    };
    const token = this.jwtService.sign(payload);
    return {
      access_token: token,
    };
  }

  // Returns a simple success message for authenticated test requests.
}
