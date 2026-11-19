import { InvalidNameError } from './auth.errors';
import { Email } from './value-objects/email';
import { Role, ROLES } from './value-objects/role';

interface RegisterProps {
  name: string;
  email: Email;
  passwordHash: string;
}

interface RestoreProps extends RegisterProps {
  id: string;
  role: Role;
}

export class User {
  private constructor(
    public readonly id: string | undefined,
    public readonly name: string,
    public readonly email: Email,
    public readonly passwordHash: string,
    public readonly role: Role,
  ) {}

  static register({ name, email, passwordHash }: RegisterProps): User {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new InvalidNameError();
    }
    return new User(undefined, trimmed, email, passwordHash, ROLES[0]);
  }
  static restore({ id, name, email, passwordHash, role }: RestoreProps): User {
    return new User(id, name, email, passwordHash, role);
  }
}
