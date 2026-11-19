import { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Connection } from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { RefreshExchangeRateUseCase } from '../src/modules/exchange-rate/application/refresh-exchange-rate.use-case';
import { ExchangeRate } from '../src/modules/exchange-rate/domain/exchange-rate';
import { EXCHANGE_RATE_PROVIDER } from '../src/modules/exchange-rate/exchange-rate.tokens';

const E2E_DATABASE = 'kambista_e2e';
const DEFAULT_MONGODB_URI =
  'mongodb://root:example@localhost:27017/kambista?authSource=admin';

/**
 * Points the app to its own throwaway database, so the tests never touch the data
 * you use while developing. Importing AppModule has already loaded the .env file.
 */
function useThrowawayDatabase(): void {
  const uri = new URL(process.env.MONGODB_URI ?? DEFAULT_MONGODB_URI);
  uri.pathname = `/${E2E_DATABASE}`;
  process.env.MONGODB_URI = uri.toString();
}

describe('Currency exchange flow (e2e)', () => {
  let app: INestApplication<App>;
  const today = new Date().toISOString().slice(0, 10);

  beforeAll(async () => {
    useThrowawayDatabase();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      // Instead of calling SUNAT, the provider returns the example rate of the challenge.
      .overrideProvider(EXCHANGE_RATE_PROVIDER)
      .useValue({
        fetchCurrent: () =>
          Promise.resolve(
            ExchangeRate.create({
              buy: 3.733,
              sell: 3.739,
              source: 'SUNAT',
              currency: 'USD',
              date: '2024-01-18',
            }),
          ),
      })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    await app.get(RefreshExchangeRateUseCase).execute(); // saves the rate
  });

  afterAll(async () => {
    if (!app) return;
    const connection = app.get<Connection>(getConnectionToken());
    // Safety check: only the throwaway database is ever dropped.
    if (connection.name === E2E_DATABASE) {
      await connection.dropDatabase();
    }
    await app.close();
  });

  /** Registers and logs in a user. Returns what the next requests need. */
  async function signUp(email: string) {
    const api = request(app.getHttpServer());
    const registered = await api
      .post('/v1/auth/register')
      .send({ nombre: 'Test User', email, password: 'password123' })
      .expect(201);
    const login = await api
      .post('/v1/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    return {
      id: registered.body.id as string,
      auth: `Bearer ${login.body.access_token as string}`,
    };
  }

  it('register -> login -> exchange -> history', async () => {
    const api = request(app.getHttpServer());
    const user = { email: 'ana@example.com', password: 'password123' };

    await api
      .post('/v1/auth/register')
      .send({ nombre: 'Ana Pérez', ...user })
      .expect(201);

    const login = await api.post('/v1/auth/login').send(user).expect(200);
    const auth = `Bearer ${login.body.access_token as string}`;
    expect(login.body.usuario).toMatchObject({
      email: user.email,
      rol: 'user',
    });

    const created = await api
      .post('/v1/transactions')
      .set('Authorization', auth)
      .send({ monedaOrigen: 'USD', monedaDestino: 'PEN', monto: 100 })
      .expect(201);
    expect(created.body).toMatchObject({
      monedaOrigen: 'USD',
      monedaDestino: 'PEN',
      monto: 100,
      montoCambiado: 373.9,
      tipoCambio: 3.739,
    });

    const history = await api
      .get('/v1/transactions/history')
      .query({ startDate: today, endDate: today })
      .set('Authorization', auth)
      .expect(200);
    expect(history.body).toHaveLength(1);
    expect(history.body[0].id).toBe(created.body.id);
  });

  it('keeps the history of each user private', async () => {
    const ana = await signUp('ana-private@example.com');
    const luis = await signUp('luis-private@example.com');

    await request(app.getHttpServer())
      .post('/v1/transactions')
      .set('Authorization', ana.auth)
      .send({ monedaOrigen: 'USD', monedaDestino: 'PEN', monto: 50 })
      .expect(201);

    // Luis asks for Ana's history, but a regular user only ever gets their own.
    const history = await request(app.getHttpServer())
      .get('/v1/transactions/history')
      .query({ startDate: today, endDate: today, userId: ana.id })
      .set('Authorization', luis.auth)
      .expect(200);
    expect(history.body).toEqual([]);
  });

  it('does not accept a transaction without a token', async () => {
    await request(app.getHttpServer())
      .post('/v1/transactions')
      .send({ monedaOrigen: 'USD', monedaDestino: 'PEN', monto: 10 })
      .expect(401);
  });
});
