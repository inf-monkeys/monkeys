import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { AxiosError } from 'axios';
import { logger } from '../logger';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  private formatMessage(exception: any): string {
    if (exception instanceof AxiosError) {
      if (exception.response?.data) {
        try {
          return JSON.stringify(exception.response?.data);
        } catch (error) {
          return exception.response?.statusText;
        }
      } else {
        return exception.message;
      }
    }
    return (exception as Error).message;
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    if (exception.statusCode) {
      status = exception.statusCode;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
    } else if (exception instanceof AxiosError) {
      status = exception.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    }
    let message = '';
    if (status === HttpStatus.NOT_FOUND) {
      message = 'Not Found';
    } else {
      logger.error('Request Exception: ', exception);
      message = this.formatMessage(exception);
    }
    response.status(status).json({
      code: status,
      message,
    });
    return;
  }
}
