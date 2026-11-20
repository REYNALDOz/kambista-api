# Kambista  API

API de cambio de dólares y soles con login JWT y roles. Hecha con **NestJS**, **TypeScript** y **MongoDB**, con Clean Architecture.

Cada 30 segundos la API trae el tipo de cambio de SUNAT y lo guarda. Un usuario se registra, inicia sesión, cambia dinero y ve su historial. Un admin puede ver el historial de cualquier usuario.

El frontend está en otro repositorio: `kambista-frontend`.

## Qué incluye

- Registro y login con JWT. Roles: `user` (por defecto) y `admin`.
- Tipo de cambio de SUNAT cada 30 s. Si SUNAT falla, se registra el error y se sigue usando la última tasa guardada.
- Cambio de moneda: USD → PEN multiplica por la tasa de venta; PEN → USD divide por la tasa de compra.
- Historial por rango de fechas, **paginado**.
- Errores claros con nombre propio y documentación en Swagger.
- **Extras:** paginación, caché del tipo de cambio, límite de intentos de login, logs en JSON, tests E2E.

## Requisitos

- Node.js v24.15.0 y pnpm 11 (use nvm para cambiar de versiones)
- Docker (para MongoDB)

## Cómo correrlo

```bash
pnpm install
cp .env.example .env        # y poné un JWT_SECRET largo y aleatorio
docker compose up -d        # levanta MongoDB
pnpm start:dev              # http://localhost:3000
```

Documentación interactiva: **http://localhost:3000/docs** (con el botón *Authorize* pegás tu token).

### Variables de entorno

Copia `.env.example`; ahí está todo explicado. Las principales:

| Variable | Obligatoria | Para qué sirve |
| --- | --- | --- |
| `MONGODB_URI` | sí | Conexión a MongoDB, con el nombre de la base |
| `JWT_SECRET` | sí | Clave para firmar tokens (mínimo 16 caracteres) |
| `JWT_EXPIRES_IN` | sí | Duración del token, por ejemplo `15m` |
| `EXCHANGE_RATE_API_URL` | sí | Proveedor del tipo de cambio de SUNAT |
| `CORS_ORIGIN` | no | Origen del frontend (por defecto `http://localhost:5173`). Se pueden poner varios separados por coma |
| `EXCHANGE_RATE_CACHE_TTL_MS` | no | Cuánto se guarda la tasa en memoria (por defecto `60000`; `0` apaga el caché) |
| `LOGIN_MAX_FAILURES` | no | Intentos fallidos de login antes de bloquear (por defecto `5`) |
| `LOGIN_WINDOW_MS` | no | Ventana de esos intentos (por defecto 15 minutos) |
| `PORT` | no | Puerto HTTP (por defecto `3000`) |

También hay `EXCHANGE_RATE_REFRESH_MS`, `EXCHANGE_RATE_TIMEOUT_MS` y `EXCHANGE_RATE_SYNC_ENABLED` (ver `.env.example`).
Si falta una variable obligatoria o es inválida, la API no arranca y dice cuál es.

### Cómo volver admin a un usuario

El rol `admin` se asigna directo en la base: Entra a su db usando un cliente y modifica.

Después, ese usuario tiene que **volver a iniciar sesión**: el rol viaja dentro del token.

## API

Todas las rutas empiezan con `/v1`. Menos registro y login, todas piden `Authorization: Bearer <token>`.

| Método | Ruta | Qué hace |
| --- | --- | --- |
| `POST` | `/auth/register` | Registra un usuario (rol `user`) |
| `POST` | `/auth/login` | Devuelve `access_token` y `usuario` |
| `GET` | `/auth/me` | Identidad y rol del token |
| `POST` | `/transactions` | Crea un cambio con la última tasa |
| `GET` | `/transactions/history` | `startDate`, `endDate`, `page`, `limit` y, solo admin, `userId` |

## Tests

```bash
pnpm test        # tests unitarios, no necesitan base de datos
pnpm test:e2e    # registro -> login -> cambio -> historial; necesita MongoDB corriendo
pnpm test:cov    # unitarios con cobertura
```
Otros scripts: `pnpm build`, `pnpm lint`, `pnpm format`.

## Estructura

```
src/
  modules/
    auth/            usuarios, registro, login, JWT y roles
    exchange-rate/   traer y guardar la tasa de SUNAT
    transactions/    cambios e historial
      domain/          entidades, errores y puertos (interfaces)
      application/     casos de uso
      infrastructure/  HTTP, MongoDB, bcrypt, JWT, cliente SUNAT
  config/            validación del entorno al arrancar
  shared/            errores de dominio a HTTP y logs por petición
test/                tests end-to-end
```

## Decisiones de diseño

**Arquitectura**
- **Tres capas, las dependencias apuntan hacia adentro.** `domain` no conoce Nest ni MongoDB. `application` define lo que necesita como puertos y `infrastructure` los implementa. Cambiar bcrypt, MongoDB o SUNAT es tocar un solo adaptador.
- **Los casos de uso no llevan decoradores de Nest.** Cada módulo conecta puertos y adaptadores en un solo lugar (`*.module.ts`).
- **Las reglas están en el dominio.** Por ejemplo, rechazar monedas iguales o montos menores o iguales a cero. Así se prueban sin HTTP.

**Dinero y datos**
- **El dinero usa `Decimal`, no `number`**: en JavaScript `100 * 3.739` da `373.90000000000003`. Se guarda como `Decimal128` y se redondea a 2 decimales.
- **Un índice único en `email`** evita dos registros simultáneos con el mismo correo.
- **Las fechas van en UTC.** Un `endDate` sin hora incluye todo ese día.

**Seguridad**
- **El dueño de la operación sale del token**, nunca del body.
- **El login no revela qué correos existen.** Correo desconocido y contraseña incorrecta dan el mismo error y tardan lo mismo.
- **Límite de intentos:** tras 5 fallos del mismo correo y dirección en 15 minutos, el login responde `429` aunque la contraseña sea correcta. Un login exitoso borra el contador. Vive en memoria (una sola instancia); con varias instancias haría falta un almacén compartido como Redis.
- **El rol viaja en el token.** Si bajan a un admin, su token sigue valiendo hasta que venza; por eso dura poco.

**Extras**
- **Historial paginado.** `page` y `limit`.
- **Caché del tipo de cambio.**
- **Logs estructurados.**
- **El scheduler no tumba la API.**

## Pendiente

- **Refresh tokens:**
