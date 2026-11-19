import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService, JwtSignOptions } from '@nestjs/jwt';
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginUseCase } from './application/login.use-case';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { PasswordHasher } from './domain/ports/password-hasher';
import { TokenIssuer } from './domain/ports/token-issuer';
import { UserRepository } from './domain/ports/user.repository';
import { PASSWORD_HASHER, TOKEN_ISSUER, USER_REPOSITORY } from './auth.tokens';
import { BcryptPasswordHasher } from './infrastructure/crypto/bcrypt-password-hasher';
import { JwtTokenIssuer } from './infrastructure/crypto/jwt-token-issuer';
import { AuthController } from './infrastructure/http/auth.controller';
import { MongoUserRepository } from './infrastructure/persistence/mongo-user.repository';
import {
  UserDocument,
  UserSchema,
} from './infrastructure/persistence/user.schema';

const USER_MODEL_NAME = 'User';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: USER_MODEL_NAME, schema: UserSchema }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: USER_REPOSITORY,
      inject: [getModelToken(USER_MODEL_NAME)],
      useFactory: (model: Model<UserDocument>) =>
        new MongoUserRepository(model),
    },
    { provide: PASSWORD_HASHER, useFactory: () => new BcryptPasswordHasher() },
    {
      provide: TOKEN_ISSUER,
      inject: [JwtService, ConfigService],
      useFactory: (jwt: JwtService, config: ConfigService) =>
        new JwtTokenIssuer(
          jwt,
          config.getOrThrow<string>(
            'JWT_EXPIRES_IN',
          ) as JwtSignOptions['expiresIn'],
        ),
    },
    {
      provide: RegisterUserUseCase,
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
      useFactory: (users: UserRepository, hasher: PasswordHasher) =>
        new RegisterUserUseCase(users, hasher),
    },
    {
      provide: LoginUseCase,
      inject: [USER_REPOSITORY, PASSWORD_HASHER, TOKEN_ISSUER],
      useFactory: (
        users: UserRepository,
        hasher: PasswordHasher,
        tokens: TokenIssuer,
      ) => new LoginUseCase(users, hasher, tokens),
    },
  ],
})
export class AuthModule {}
