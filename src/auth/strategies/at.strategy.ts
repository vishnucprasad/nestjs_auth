import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../types';
import { AuthService } from '../auth.service';
import { User } from '@prisma/client';

@Injectable()
export class AtStrategy extends PassportStrategy(Strategy) {
  constructor(
    protected readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('AT_SECRET'),
    });
  }

  public async validate(payload: JwtPayload): Promise<Partial<User>> {
    return await this.authService.findUserById(payload.sub);
  }
}
