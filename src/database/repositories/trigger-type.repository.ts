import { generateDbId } from '@/common/utils';
import { TriggerDefinition } from '@/modules/tools/interfaces';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ToolsTriggerTypesEntity } from '../entities/tools/tools-trigger-types';

@Injectable()
export class TriggerTypeRepository {
  constructor(
    @InjectRepository(ToolsTriggerTypesEntity)
    private readonly triggerTypesRepository: Repository<ToolsTriggerTypesEntity>,
  ) {}

  public async createOrUpdateTriggerTypes(namespace: string, latestTriggers: TriggerDefinition[]) {
    latestTriggers = latestTriggers.map((x) => {
      x.type = `${namespace}__${x.type}`;
      return x;
    });
    const latestTypes = latestTriggers.map((x) => x.type);
    const originalCredentials = await this.triggerTypesRepository.find({
      where: {
        namespace,
        isDeleted: false,
      },
    });
    const originalTypes = originalCredentials.map((x) => x.type);
    const toDelete = originalCredentials.filter((x) => !latestTypes.includes(x.type));
    const toCreate = latestTriggers.filter((x) => !originalTypes.includes(x.type));
    const toUpdate = originalCredentials.filter((x) => latestTypes.includes(x.type));

    if (toCreate.length) {
      const entitiesToCreate: ToolsTriggerTypesEntity[] = toCreate.map(
        (x): ToolsTriggerTypesEntity => ({
          id: generateDbId(),
          isDeleted: false,
          createdTimestamp: +new Date(),
          updatedTimestamp: +new Date(),
          namespace: namespace,
          type: x.type,
          displayName: x.displayName,
          description: x.description,
          icon: x.icon,
          properties: x.properties,
        }),
      );
      await this.triggerTypesRepository.save(entitiesToCreate);
    }

    if (toDelete.length) {
      await this.triggerTypesRepository.update(
        {
          namespace,
          type: In(toDelete.map((x) => x.type)),
        },
        {
          isDeleted: true,
        },
      );
    }

    if (toUpdate.length) {
      const entitiesToUpdate = toUpdate.map((x): ToolsTriggerTypesEntity => {
        const latestDef = latestTriggers.find((t) => x.type === t.type);
        return {
          ...x,
          id: x.id,
          updatedTimestamp: +new Date(),
          displayName: latestDef.displayName,
          description: latestDef.description,
          icon: latestDef.icon,
          properties: latestDef.properties,
          type: latestDef.type,
        };
      });
      await this.triggerTypesRepository.save(entitiesToUpdate);
    }
  }

  public async listTriggerTypes() {
    return await this.triggerTypesRepository.find({
      where: {
        isDeleted: false,
      },
    });
  }

  public async getTriggerType(type: string) {
    return this.triggerTypesRepository.findOne({
      where: {
        type,
      },
    });
  }
}
