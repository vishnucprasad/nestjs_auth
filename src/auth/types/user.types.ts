import { User as UserModel } from '@prisma/client';

export type User = Partial<UserModel>;

export type UserWithRt = User & { rt: string };
