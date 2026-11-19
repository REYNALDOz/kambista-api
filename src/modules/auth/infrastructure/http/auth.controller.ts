import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RequestLogInterceptor } from '../../../../shared/request-log.interceptor';
import { RegisterUserUseCase } from '../../application/register-user.use-case';
import { LoginUseCase } from '../../application/login.use-case';
import { LoginResponse, UserResponse } from './dto/auth.responses';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import type { AuthenticatedUser } from '../security/authenticated-user';
import { CurrentUser } from '../security/current-user.decorator';
import { JwtAuthGuard } from '../security/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUseCase,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user (always with the "user" role)',
  })
  @ApiCreatedResponse({ type: UserResponse })
  @ApiBadRequestResponse({ description: 'Invalid or unknown fields' })
  @ApiConflictResponse({ description: 'The email is already registered' })
  async register(@Body() dto: RegisterUserDto) {
    const user = await this.registerUser.execute({
      name: dto.nombre,
      email: dto.email,
      password: dto.password,
    });
    return {
      id: user.id,
      nombre: user.name,
      email: user.email,
      rol: user.role,
    };
  }

  @Post('login')
  @HttpCode(200)
  @UseInterceptors(RequestLogInterceptor)
  @ApiOperation({ summary: 'Log in and get an access token' })
  @ApiOkResponse({ type: LoginResponse })
  @ApiBadRequestResponse({ description: 'Missing or unknown fields' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiTooManyRequestsResponse({
    description: 'Too many failed attempts for this email and address',
  })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const { accessToken, user } = await this.loginUser.execute({
      email: dto.email,
      password: dto.password,
      address: req.ip,
    });
    return {
      access_token: accessToken,
      usuario: {
        id: user.id,
        nombre: user.name,
        email: user.email,
        rol: user.role,
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Identity and role stored in the access token' })
  @ApiUnauthorizedResponse({ description: 'Missing, invalid or expired token' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return { id: user.id, rol: user.role };
  }
}
