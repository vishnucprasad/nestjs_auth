import { ForbiddenException, Injectable } from '@nestjs/common';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, SigninDto } from './dto';
import { JwtPayload, Tokens, User } from './types';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  public async localSignup(dto: CreateUserDto): Promise<Tokens> {
    try {
      const hash = await this.hashData(dto.password);

      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          hash,
        },
      });

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
      };

      const tokens = await this.generateTokens(payload);
      await this.updateRtHash(user.id, tokens.refresh_token);
      return tokens;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError ||
        error.code === 'P2002'
      ) {
        throw new ForbiddenException(`Email ${dto.email} already exists`);
      }

      throw error;
    }
  }

  public async localSignin(dto: SigninDto): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) throw new ForbiddenException('Access denied');

    const isPasswordMatch = await argon.verify(user.hash, dto.password);

    if (!isPasswordMatch) throw new ForbiddenException('Access denied');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const tokens = await this.generateTokens(payload);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  public async refreshTokens(userId: number, rt: string): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.rtHash) throw new ForbiddenException('Access denied');

    const isRtMatch = await argon.verify(user.rtHash, rt);

    if (!isRtMatch) throw new ForbiddenException('Access denied');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const tokens = await this.generateTokens(payload);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  public async signout(userId: number): Promise<void> {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        rtHash: {
          not: null,
        },
      },
      data: {
        rtHash: null,
      },
    });
  }

  public async findUserById(userId: number): Promise<User> {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updateAt: true,
      },
    });
  }

  private hashData(data: string): Promise<string> {
    return argon.hash(data);
  }

  private async generateTokens(payload: JwtPayload): Promise<Tokens> {
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
