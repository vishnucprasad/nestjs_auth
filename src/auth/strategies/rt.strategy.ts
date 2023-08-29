import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, 'jwt-rt') {
  constructor(
    protected readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('RT_SECRET'),
      passReqToCallback: true,
    });
  }

  public async validate(
    req: Request,
    payload: JwtPayload,
  ): Promise<Partial<User & { rt: string }>> {
    const user = await this.authService.findUserById(payload.sub);
    const rt = req.get('authorization').replace('Bearer', '').trim();

    return {
      ...user,
      rt,
    };
  }
}
