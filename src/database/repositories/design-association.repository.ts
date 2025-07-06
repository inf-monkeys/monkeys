import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignAssociationEntity } from '../entities/design/design-association';

@Injectable()
export class DesignAssociationRepository {
  constructor(
    @InjectRepository(DesignAssociationEntity)
    private readonly designAssociationRepository: Repository<DesignAssociationEntity>,
  ) {}

  public async create(designAssociation: Omit<DesignAssociationEntity, 'id'>) {
    const id = generateDbId();
    const associationToSave = {
      ...designAssociation,
      id,
      createdTimestamp: Date.now(),
      updatedTimestamp: Date.now(),
      isDeleted: false,
    };
    return this.designAssociationRepository.save(associationToSave);
  }

  public async findById(id: string) {
    return this.designAssociationRepository.findOne({ where: { id, isDeleted: false } });
  }

  public async listDesignAssociations(teamId: string) {
    return await this.designAssociationRepository.find({
      where: {
        teamId,
        isDeleted: false,
      },
    });
  }

  public async update(id: string, designAssociation: DesignAssociationEntity) {
    return this.designAssociationRepository.update(id, designAssociation);
  }

  public async delete(id: string) {
    await this.designAssociationRepository.update(id, { isDeleted: true });
  }
}
