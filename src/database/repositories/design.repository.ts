import { generateDbId } from '@/common/utils';
import { CreateDesignDto } from '@/modules/design/dto/create-design.dto';
import { UpdateDesignDto } from '@/modules/design/dto/update-design.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignEntity } from '../entities/design/design';

@Injectable()
export class DesignRepository {
  constructor(
    @InjectRepository(DesignEntity)
    private readonly designRepository: Repository<DesignEntity>,
  ) {}

  public async listAllDesignsByTeamId(teamId: string) {
    const data = await this.designRepository.find({
      where: {
        teamId,
      },
    });
    return data;
  }
  public async createDesign(createDesignDto: CreateDesignDto) {
    const id = generateDbId();
    return this.designRepository.save({
      ...createDesignDto,
      id,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    });
  }
  public async findById(designId: string) {
    const data = await this.designRepository.findOne({
      where: {
        id: designId,
      },
    });
    return data;
  }
  public async updateDesign(designId: string, updateDesignDto: UpdateDesignDto) {
    return await this.designRepository.update(designId, updateDesignDto);
  }
  public async deleteDesign(designId: string) {
    const data = await this.designRepository.findOne({
      where: {
        id: designId,
      },
    });
    if (!data) {
      return;
    }
    await this.designRepository.update(data.id, { isDeleted: true });
  }
}
