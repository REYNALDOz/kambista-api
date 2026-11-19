# Kambista FX API

A currency exchange API with JWT authentication and roles, built with **NestJS**, **TypeScript** and **MongoDB**, following Clean Architecture and DDD.

Users register, log in and exchange dollars and soles using the latest SUNAT exchange rate, which the API fetches and stores every 30 seconds. A user sees their own history; an admin can see the history of any user.

The web app lives in a separate repository: `kambista-frontend`.

## Features

- Register and log in with JWT. Roles: `user` (default) and `admin`.
- SUNAT exchange rate fetched every 30 seconds and saved. If the provider fails, the error is logged and the last saved rate keeps serving.
- Create an exchange: USD to PEN multiplies by the sell rate, PEN to USD divides by the buy rate.
- History by date range. A user sees only their own; an admin can ask for any user.
- Validation with specific, descriptive errors. Swagger documentation.

## Prerequisites

- Node.js 24 and pnpm 11 (the versions it was developed with)
- Docker, to run MongoDB

## Getting started

```bash
pnpm install
cp .env.example .env        # then set JWT_SECRET to a long random value
docker compose up -d        # starts MongoDB
pnpm start:dev              # http://localhost:3000
```

The interactive documentation is at **http://localhost:3000/docs** (use the *Authorize* button to paste a token).

### Environment variables

Copy `.env.example`; every variable is explained there.

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string, including the database name |
| `JWT_SECRET` | yes | Secret used to sign tokens (at least 16 characters) |
| `JWT_EXPIRES_IN` | yes | Token lifetime, for example `15m` or `1h` |
| `EXCHANGE_RATE_API_URL` | yes | SUNAT exchange rate provider |
| `EXCHANGE_RATE_REFRESH_MS` | no | How often the rate is fetched (default `30000`) |
| `EXCHANGE_RATE_TIMEOUT_MS` | no | Timeout of each fetch (default `5000`) |
| `EXCHANGE_RATE_SYNC_ENABLED` | no | `false` turns the periodic fetch off |
| `CORS_ORIGIN` | no | Web app origin (default `http://localhost:5173`). Several can be separated by commas. A trailing slash or spaces are tolerated, and an empty value means the default |
| `PORT` | no | HTTP port (default `3000`) |

The API refuses to start, with a clear message, if a required variable is missing or invalid.

### Making a user an admin

The `admin` role is managed directly in the database:

```bash
docker exec -it kambista-mongo mongosh -u <MONGO_ROOT_USER> -p <MONGO_ROOT_PASSWORD> --authenticationDatabase admin
> use kambista
> db.users.updateOne({ email: "juan@example.com" }, { $set: { role: "admin" } })
```
Then log in again: the role travels inside the token.

## API

All routes are under `/v1`. Everything except register and login needs `Authorization: Bearer <token>`.

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Register a user (role `user`) |
| `POST` | `/auth/login` | Returns `access_token` and `usuario` |
| `GET` | `/auth/me` | Identity and role stored in the token |
| `POST` | `/transactions` | Create an exchange with the latest rate |
| `GET` | `/transactions/history` | `startDate`, `endDate` and, for admins, `userId` |

```bash
curl -X POST localhost:3000/v1/auth/register -H 'Content-Type: application/json' \
  -d '{"nombre":"Juan Pérez","email":"juan@example.com","password":"contraseña123"}'

curl -X POST localhost:3000/v1/transactions -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"monedaOrigen":"USD","monedaDestino":"PEN","monto":100}'
```

Errors use specific names, for example `EmailAlreadyRegisteredError` (409), `InvalidCredentialsError` (401), `SameCurrencyError` (400) or `ExchangeRateNotAvailableError` (503, no rate saved yet).

## Running the tests

```bash
pnpm test        # unit tests, no database needed
pnpm test:e2e    # register -> login -> exchange -> history; needs MongoDB running
pnpm test:cov    # unit tests with coverage
```

The e2e tests use their own throwaway database (`kambista_e2e`, dropped at the end) and a fixed exchange rate, so they never touch your data nor call SUNAT.

Other scripts: `pnpm build`, `pnpm lint`, `pnpm format`.

## Project structure

```
src/
  modules/
    auth/            users, register, login, JWT guard and roles
    exchange-rate/   fetch and save the SUNAT rate
    transactions/    exchange requests and history
      domain/          entities, value objects, errors and ports (interfaces)
      application/     use cases
      infrastructure/  HTTP, MongoDB, bcrypt, JWT, SUNAT client
  config/            startup validation of the environment
  shared/            domain error to HTTP status mapping
test/                end-to-end tests
```

## Architecture decisions

- **Three layers, dependencies point inwards.** `domain` knows nothing about Nest or MongoDB. `application` defines what it needs as ports (`UserRepository`, `PasswordHasher`, `ExchangeRateProvider`...) and `infrastructure` implements them. Controllers and MongoDB are both adapters, so they live together.
- **Use cases have no Nest decorators.** Each module wires ports to adapters in one place (`*.module.ts`), so swapping bcrypt, MongoDB or SUNAT means touching one adapter.
- **Money uses `Decimal`, not `number`.** `100 * 3.739` is `373.90000000000003` in JavaScript. Amounts are stored as `Decimal128` and rounded to 2 decimals.
- **Rules live in the domain.** `Transaction.create` rejects equal currencies and amounts that are not greater than zero, and picks sell or buy. "A user only sees their own history" is in the use case, so it is tested without HTTP.
- **The owner of a transaction comes from the token**, never from the request body.
- **Login does not reveal which emails exist.** An unknown email and a wrong password give the same error, and both do the same bcrypt work so they take the same time.
- **A unique index on `email`** is the final guarantee against two simultaneous registrations; the use case only checks it to give a friendly error.
- **The scheduler never crashes the API.** A provider failure is logged and the last saved rate keeps being used. Fetches never overlap.
- **Dates are handled in UTC.** An `endDate` without time includes that whole day.
- **The role travels inside the token.** If an admin is demoted, their token keeps working until it expires, which is why the lifetime is short.

## Not implemented yet

Extras from the challenge that this repository does not have, and what I would do:

- **Login rate limiting:** limit failed attempts per email and address. An in-memory counter works for one instance; several instances need a shared store such as Redis.
- **Refresh tokens:** short-lived access tokens plus a rotating refresh token, stored hashed.
- **Paginated history:** `page` and `limit` parameters with the total in a header. Today the history returns every match.
- **Exchange rate cache:** keep the latest rate in memory with a short TTL, to avoid reading the database on every transaction.
- **Structured logging:** one JSON line per request with method, path, status, duration and user id.
- **History cleanup:** every refresh saves a new document (2,880 per day). A TTL index could expire the old ones.
