import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, SigninDto } from './dto';
import { Tokens, User } from './types';
import { RtGuard } from './guards';
import { CurrentUser, Public } from './decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('user')
  public getCurrentUser(@CurrentUser() user: User): User {
    return user;
  }

  @Public()
  @Post('local/signup')
  public localSignup(@Body() dto: CreateUserDto): Promise<Tokens> {
    return this.authService.localSignup(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('local/signin')
  public localSignin(@Body() dto: SigninDto): Promise<Tokens> {
    return this.authService.localSignin(dto);
  }

  @Public()
  @UseGuards(RtGuard)
  @Post('refresh')
  public refreshTokens(
    @CurrentUser('id') userId: number,
    @CurrentUser('rt') rt: string,
  ): Promise<Tokens> {
    return this.authService.refreshTokens(userId, rt);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('signout')
  public signout(@CurrentUser('id') userId: number): Promise<void> {
    return this.authService.signout(userId);
  }
}
