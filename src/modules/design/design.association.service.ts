import { DesignAssociationRepository } from '@/database/repositories/design-association.repository';
import { Injectable } from '@nestjs/common';
import { DesignAssociationEntity } from '../../database/entities/design/design-association';
import { CreateDesignAssociationDto } from './dto/create-design-association.dto';

@Injectable()
export class DesignAssociationService {
  constructor(private readonly designAssociationRepository: DesignAssociationRepository) {}

  async create(createDesignAssociationDto: CreateDesignAssociationDto) {
    const associationEntity = new DesignAssociationEntity();

    Object.assign(associationEntity, createDesignAssociationDto);

    const createdAssociation = await this.designAssociationRepository.create(associationEntity);

    return createdAssociation;
  }

  async findById(id: string) {
    return this.designAssociationRepository.findById(id);
  }

  async findByTeamId(teamId: string) {
    return await this.designAssociationRepository.listDesignAssociations(teamId);
  }

  async update(id: string, designAssociation: DesignAssociationEntity) {
    return this.designAssociationRepository.update(id, designAssociation);
  }

  async delete(id: string) {
    return this.designAssociationRepository.delete(id);
  }
}
