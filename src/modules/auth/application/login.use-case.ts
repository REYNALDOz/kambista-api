import {
  InvalidCredentialsError,
  InvalidEmailError,
} from '../domain/auth.errors';
import { PasswordHasher } from '../domain/ports/password-hasher';
import { TokenIssuer } from '../domain/ports/token-issuer';
import { UserRepository } from '../domain/ports/user.repository';
import { User } from '../domain/user';
import { Email } from '../domain/value-objects/email';
import { Role } from '../domain/value-objects/role';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  accessToken: string;
  user: { id: string; name: string; email: string; role: Role };
}

export class LoginUseCase {
  private decoyHash?: Promise<string>;

  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenIssuer,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.findUser(input.email);

    // Aqui vamos  agregar los intentos de login, más adelante se puede agregar un limite de intentos.
    // siempre se compara una vez, incluso sin un usuario, para que cada fallo tome el mismo tiempo.
    const hashToCompare = user?.passwordHash ?? (await this.getDecoyHash());
    const passwordMatches = await this.hasher.compare(
      input.password,
      hashToCompare,
    );

    // mismo error para email desconocido y contrasenia incorrecta: no revelar que emails existen.
    if (!user || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const id = user.id as string;
    const accessToken = await this.tokens.issue({ sub: id, role: user.role });

    return {
      accessToken,
      user: { id, name: user.name, email: user.email.value, role: user.role },
    };
  }

  private async findUser(rawEmail: string): Promise<User | null> {
    try {
      return await this.users.findByEmail(Email.create(rawEmail));
    } catch (error) {
      // un email mal formado no puede pertenecer a ningun usuario: tratarlo como "no encontrado".
      if (error instanceof InvalidEmailError) {
        return null;
      }
      throw error;
    }
  }

  private getDecoyHash(): Promise<string> {
    this.decoyHash ??= this.hasher.hash('decoy-password-for-timing');
    return this.decoyHash;
  }
}
