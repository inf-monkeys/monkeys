import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantService {
  async findAll() {
    return `This action returns all tenant`;
  }
}
