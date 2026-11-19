import { Role } from '../../domain/value-objects/role';

export interface AuthenticatedUser {
  id: string;
  role: Role;
}
