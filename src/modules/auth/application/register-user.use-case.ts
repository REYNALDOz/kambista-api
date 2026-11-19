import { EmailAlreadyRegisteredError } from '../domain/auth.errors';
import { PasswordHasher } from '../domain/ports/password-hasher';
import { UserRepository } from '../domain/ports/user.repository';
import { User } from '../domain/user';
import { Email } from '../domain/value-objects/email';
import { Role } from '../domain/value-objects/role';

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface RegisterUserOutput {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const email = Email.create(input.email);

    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyRegisteredError();
    }

    const passwordHash = await this.hasher.hash(input.password);
    const saved = await this.users.save(
      User.register({ name: input.name, email, passwordHash }),
    );

    return {
      id: saved.id as string,
      name: saved.name,
      email: saved.email.value,
      role: saved.role,
    };
  }
}
