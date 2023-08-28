import { Injectable } from '@nestjs/common';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto';
import { Payload, Tokens } from './types';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  public async localSignup(dto: CreateUserDto): Promise<Tokens> {
    const hash = await this.hashData(dto.password);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        hash,
      },
    });

    const payload: Payload = {
      sub: user.id,
      email: user.email,
    };

    const tokens = await this.generateTokens(payload);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  public localSignin() {}

  public refreshTokens() {}

  public signout() {}

  private hashData(data: string): Promise<string> {
    return argon.hash(data);
  }

  private async generateTokens(payload: Payload): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwt.signAsync(payload, {
        expiresIn: '10m',
        secret: this.config.get<string>('AT_SECRET'),
      }),
      this.jwt.signAsync(payload, {
        expiresIn: '60d',
        secret: this.config.get<string>('RT_SECRET'),
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  private async updateRtHash(userId: number, rt: string): Promise<void> {
    const hash = await this.hashData(rt);

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        rtHash: hash,
      },
    });
  }
}
