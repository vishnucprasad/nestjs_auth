import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto';
import { Tokens } from './types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('local/signup')
  public localSignup(@Body() dto: CreateUserDto): Promise<Tokens> {
    return this.authService.localSignup(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('local/signin')
  public localSignin() {
    return this.authService.localSignin();
  }

  @Post('refresh')
  public refreshTokens() {
    return this.authService.refreshTokens();
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('signout')
  public signout() {
    return this.authService.signout();
  }
}
