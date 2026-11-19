import { ApiProperty } from '@nestjs/swagger';
import { type Role, ROLES } from '../../../domain/value-objects/role';

export class UserResponse {
  @ApiProperty({ example: '65a1b2c3d4e5f6a7b8c9d0e1' })
  id!: string;

  @ApiProperty({ example: 'Juan Pérez' })
  nombre!: string;

  @ApiProperty({ example: 'juan@example.com' })
  email!: string;

  @ApiProperty({ enum: ROLES, example: 'user' })
  rol!: Role;
}

export class LoginResponse {
  @ApiProperty({
    description: 'JWT to send as "Authorization: Bearer <token>"',
  })
  access_token!: string;

  @ApiProperty({ type: UserResponse })
  usuario!: UserResponse;
}
