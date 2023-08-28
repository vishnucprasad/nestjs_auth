import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        AT_SECRET: Joi.string().required(),
        RT_SECRET: Joi.string().required(),
      }),
      envFilePath: '/.env',
    }),
    AuthModule,
    PrismaModule,
  ],
})
export class AppModule {}
