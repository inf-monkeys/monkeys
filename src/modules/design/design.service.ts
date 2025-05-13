import { DesignRepository } from '@/database/repositories/design.repository';
import { Injectable } from '@nestjs/common';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';

@Injectable()
export class DesignService {
  constructor(private readonly designRepository: DesignRepository) {}

  async create(createDesignDto: CreateDesignDto) {
    return await this.designRepository.createDesign(createDesignDto);
  }

  async findAllbyTeamId(teamId: string) {
    return await this.designRepository.listAllDesignsByTeamId(teamId);
  }

  async findById(id: string) {
    return await this.designRepository.findById(id);
  }

  async update(id: string, updateDesignDto: UpdateDesignDto) {
    return await this.designRepository.updateDesign(id, updateDesignDto);
  }

  async remove(id: string) {
    return this.designRepository.deleteDesign(id);
  }
}
