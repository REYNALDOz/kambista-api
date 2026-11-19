import { JwtService } from '@nestjs/jwt';
import { TokenIssuer, TokenPayload } from '../../domain/ports/token-issuer';

export class JwtTokenIssuer implements TokenIssuer {
  constructor(
    private readonly jwt: JwtService,
    private readonly expiresIn: string,
  ) {}

  issue({ sub, role }: TokenPayload): Promise<string> {
    return this.jwt.signAsync(
      { sub, role },
      { expiresIn: this.expiresIn as never },
    );
  }
}
