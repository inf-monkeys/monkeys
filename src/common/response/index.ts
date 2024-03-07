import { HttpStatus } from '@nestjs/common';

export class SuccessResponse {
  code: HttpStatus;
  message: string;
  data: any;
  constructor(options?: { code?: HttpStatus; message?: string; data: any }) {
    this.code = options?.code || HttpStatus.OK;
    this.message = options?.message || 'ok';
    this.data = options?.data;
  }
}

export class SuccessListResponse {
  code: HttpStatus;
  page: number;
  limit: number;
  total: number;
  data: any;
  constructor(options?: { code?: HttpStatus; page?: number; limit?: number; total: number; data: any }) {
    this.code = options?.code || HttpStatus.OK;
    this.data = options?.data || [];
    this.total = options?.total || 0;
    this.page = options?.page || 1;
    this.limit = options?.limit || 10;
  }
}
