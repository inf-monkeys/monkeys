import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';
import { logger } from '../logger';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    logger.error('Request Exception: ', exception);
    const message = exception instanceof AxiosError ? (exception.response?.data ? JSON.stringify(exception.response?.data) : exception.message) : (exception as Error).message;
    response.status(status).json({
      code: status,
      message,
    });
    return;
  }
}
