import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as jwt from 'jsonwebtoken';
import { createLogger } from '@packages/common-utils';

const logger = createLogger('auth-service');

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  async register(email: string, password: string, name: string) {
    const user = await this.usersService.create(email, password, name);

    logger.info(`New user registered: ${user.email}`);

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      message: 'Usuário registrado com sucesso',
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await this.usersService.validatePassword(user, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const accessToken = this.generateAccessToken(user.id, user.email, user.name);

    logger.info(`User logged in: ${user.email}`);

    return {
      accessToken,
      expiresIn: '15m',
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  private generateAccessToken(userId: string, email: string, name: string): string {
    const privateKey = this.configService.get<string>('JWT_PRIVATE_KEY');

    if (!privateKey) {
      throw new Error('JWT_PRIVATE_KEY not configured');
    }

    const payload = {
      sub: userId,
      email,
      name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60,
    };

    return jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      keyid: 'key-1',
    });
  }

  async validateToken(token: string) {
    try {
      const publicKey = this.configService.get<string>('JWT_PUBLIC_KEY');

      if (!publicKey) {
        throw new Error('JWT_PUBLIC_KEY not configured');
      }

      const decoded = jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
      });

      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}
