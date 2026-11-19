import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import type { AuthenticatedUser } from '../modules/auth/infrastructure/security/authenticated-user';


@Injectable()
export class RequestLogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request & { user?: AuthenticatedUser }>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();

    response.once('finish', () => {
      const statusCode = response.statusCode;
      const line = {
        severity: statusCode >= 500 ? 'ERROR' : 'INFO',
        message: `${request.method} ${request.route?.path ?? request.path} ${statusCode}`,
        method: request.method,
        path: request.path,
        statusCode,
        durationMs: Date.now() - startedAt,
        userId: request.user?.id,
      };
      process.stdout.write(`${JSON.stringify(line)}\n`);
    });

    return next.handle();
  }
}
