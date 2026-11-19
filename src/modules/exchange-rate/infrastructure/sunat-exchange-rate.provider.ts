import { ExchangeRate } from '../domain/exchange-rate';
import { ExchangeRateUnavailableError } from '../domain/exchange-rate.errors';
import { ExchangeRateProvider } from '../domain/ports/exchange-rate.provider';

interface SunatResponse {
  compra: number | string;
  venta: number | string;
  origen: string;
  moneda: string;
  fecha: string;
}

export class SunatExchangeRateProvider implements ExchangeRateProvider {
  constructor(
    private readonly url: string,
    private readonly timeoutMs: number,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async fetchCurrent(): Promise<ExchangeRate> {
    const body = await this.request();

    return ExchangeRate.create({
      buy: body.compra,
      sell: body.venta,
      source: body.origen,
      currency: body.moneda,
      date: body.fecha,
    });
  }

  private async request(): Promise<SunatResponse> {
    let response: Response;
    try {
      response = await this.fetchFn(this.url, {
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new ExchangeRateUnavailableError(describe(error));
    }

    if (!response.ok) {
      throw new ExchangeRateUnavailableError(
        `provider responded with HTTP ${response.status}`,
      );
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      throw new ExchangeRateUnavailableError(
        `response body could not be read (${describe(error)})`,
      );
    }

    if (!isSunatResponse(body)) {
      throw new ExchangeRateUnavailableError(
        'response is missing required fields',
      );
    }
    return body;
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isNumeric(value: unknown): boolean {
  return typeof value === 'number' || typeof value === 'string';
}

function isSunatResponse(body: unknown): body is SunatResponse {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const candidate = body as Record<string, unknown>;
  return (
    isNumeric(candidate.compra) &&
    isNumeric(candidate.venta) &&
    typeof candidate.origen === 'string' &&
    typeof candidate.moneda === 'string' &&
    typeof candidate.fecha === 'string'
  );
}
