import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import * as bcrypt from 'bcrypt';
import { Counter, Gauge } from 'prom-client';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { AuthUser } from './authType';

@Injectable()
// No rate limiting / brute-force protection logic- Implemented as a global level
export class AuthService {
  // Injects user lookup and JWT utilities used during authentication.
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectMetric('auth_requests_total')
    private readonly authRequestsCounter: Counter<string>,
    @InjectMetric('auth_failures_total')
    private readonly authFailuresCounter: Counter<string>,
    @InjectMetric('active_users')
    private readonly activeUsersGauge: Gauge<string>,
  ) {}

  // Validates user credentials and returns a sanitized user object on success.
  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthUser | null> {
    this.authRequestsCounter.inc();

    try {
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }

      this.activeUsersGauge.inc();

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    } catch (error) {
      this.authFailuresCounter.inc();
      throw error;
    }
  }

  // Creates a signed JWT payload for an authenticated user.
  async login(user: AuthUser) {
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
    };
  }
}
