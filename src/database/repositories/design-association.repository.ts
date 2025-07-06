import { generateDbId } from '@/common/utils';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignAssociationEntity } from '../entities/design/design-association';
import { InstalledAppEntity } from '../entities/marketplace/installed-app.entity';

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
    return this.designAssociationRepository.manager.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.delete(InstalledAppEntity, {
        installedAssetIds: {
          'design-association': [id],
        },
      });
      return await transactionalEntityManager.update(DesignAssociationEntity, { id }, { isDeleted: true });
    });
  }
}
