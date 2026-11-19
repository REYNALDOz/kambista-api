import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RegisterUserUseCase } from '../../application/register-user.use-case';
import { LoginUseCase } from '../../application/login.use-case';
import { LoginResponse, UserResponse } from './dto/auth.responses';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';

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
  @ApiOperation({ summary: 'Log in and get an access token' })
  @ApiOkResponse({ type: LoginResponse })
  @ApiBadRequestResponse({ description: 'Missing or unknown fields' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    const { accessToken, user } = await this.loginUser.execute({
      email: dto.email,
      password: dto.password,
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
}
