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
import {
  LOGIN_ATTEMPT_LIMITER,
  PASSWORD_HASHER,
  TOKEN_ISSUER,
  USER_REPOSITORY,
} from './auth.tokens';
import { LoginAttemptLimiter } from './domain/ports/login-attempt-limiter';
import { InMemoryLoginAttemptLimiter } from './infrastructure/security/in-memory-login-attempt-limiter';
import { BcryptPasswordHasher } from './infrastructure/crypto/bcrypt-password-hasher';
import { JwtTokenIssuer } from './infrastructure/crypto/jwt-token-issuer';
import { AuthController } from './infrastructure/http/auth.controller';
import { MongoUserRepository } from './infrastructure/persistence/mongo-user.repository';
import {
  UserDocument,
  UserSchema,
} from './infrastructure/persistence/user.schema';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './infrastructure/security/jwt.strategy';

const USER_MODEL_NAME = 'User';
const DEFAULT_LOGIN_MAX_FAILURES = 5;
const DEFAULT_LOGIN_WINDOW_MS = 15 * 60 * 1000;

@Module({
  imports: [
    MongooseModule.forFeature([{ name: USER_MODEL_NAME, schema: UserSchema }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
    PassportModule,
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
      provide: LOGIN_ATTEMPT_LIMITER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new InMemoryLoginAttemptLimiter(
          Number(config.get('LOGIN_MAX_FAILURES', DEFAULT_LOGIN_MAX_FAILURES)),
          Number(config.get('LOGIN_WINDOW_MS', DEFAULT_LOGIN_WINDOW_MS)),
        ),
    },
    {
      provide: LoginUseCase,
      inject: [
        USER_REPOSITORY,
        PASSWORD_HASHER,
        TOKEN_ISSUER,
        LOGIN_ATTEMPT_LIMITER,
      ],
      useFactory: (
        users: UserRepository,
        hasher: PasswordHasher,
        tokens: TokenIssuer,
        limiter: LoginAttemptLimiter,
      ) => new LoginUseCase(users, hasher, tokens, limiter),
    },
    JwtStrategy,
  ],
})
export class AuthModule {}
