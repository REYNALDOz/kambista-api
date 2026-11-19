import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidEmailError,
  InvalidNameError,
} from '../modules/auth/domain/auth.errors';

const STATUS_BY_ERROR = new Map<new (...args: never[]) => Error, HttpStatus>([
  [EmailAlreadyRegisteredError, HttpStatus.CONFLICT],
  [InvalidEmailError, HttpStatus.BAD_REQUEST],
  [InvalidNameError, HttpStatus.BAD_REQUEST],
  [InvalidCredentialsError, HttpStatus.UNAUTHORIZED],
]);

@Catch(...STATUS_BY_ERROR.keys())
export class DomainExceptionFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost): void {
    const status =
      STATUS_BY_ERROR.get(error.constructor as never) ?? HttpStatus.BAD_REQUEST;
    const response = host.switchToHttp().getResponse<Response>();

    response
      .status(status)
      .json({ statusCode: status, error: error.name, message: error.message });
  }
}
