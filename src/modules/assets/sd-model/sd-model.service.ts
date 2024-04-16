import { ListDto } from '@/common/dto/list.dto';
import { SdModelRepository } from '@/database/repositories/sd-model.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SdModelService {
  constructor(private readonly sdModelRepository: SdModelRepository) {}

  public async listSdModels(teamId: string, dto: ListDto) {
    return await this.sdModelRepository.listSdModels(teamId, dto);
  }
}
