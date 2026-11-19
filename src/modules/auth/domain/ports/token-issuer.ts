import { Role } from '../value-objects/role';

export interface TokenPayload {
  sub: string;
  role: Role;
}

export interface TokenIssuer {
  issue(payload: TokenPayload): Promise<string>;
}
