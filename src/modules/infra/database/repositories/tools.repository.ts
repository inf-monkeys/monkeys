import { ToolsCredentialEntity } from '@/entities/tools/tools-credential.entity';
import { ToolsServerEntity } from '@/entities/tools/tools-server.entity';
import { ToolsEntity } from '@/entities/tools/tools.entity';
import { CredentialDefinition, ManifestJson } from '@/modules/tools/interfaces';
import { BlockDefinition, BlockType } from '@inf-monkeys/vines';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { In, Repository } from 'typeorm';

@Injectable()
export class ToolsRepository {
  constructor(
    @InjectRepository(ToolsEntity)
    private readonly toolsRepository: Repository<ToolsEntity>,
    @InjectRepository(ToolsServerEntity)
    private readonly toolsServerRepository: Repository<ToolsServerEntity>,
    @InjectRepository(ToolsCredentialEntity)
    private readonly toolsCredentialRepository: Repository<ToolsCredentialEntity>,
  ) {}

  public async isServerNamespaceExists(namespace: string) {
    return await this.toolsServerRepository.exists({
      where: {
        namespace,
        isDeleted: false,
      },
    });
  }

  public async getServerByNamespace(namespace: string) {
    return await this.toolsServerRepository.findOne({
      where: {
        namespace: namespace,
        isDeleted: true,
      },
    });
  }

  public async saveServer(data: ManifestJson) {
    // save server info
    const originalEntity = await this.toolsServerRepository.findOne({
      where: {
        namespace: data.namespace,
        isDeleted: false,
      },
    });
    const entity = new ToolsServerEntity();
    entity.id = originalEntity?.id || new ObjectId();
    entity.schemaVersion = data.schema_version;
    entity.api = data.api;
    entity.auth = data.auth;
    entity.namespace = data.namespace;
    await this.toolsServerRepository.save(entity);
  }

  public async createOrUpdateCredentials(namespace: string, latestCredentials: CredentialDefinition[]) {
    const latestCredentialNames = latestCredentials.map((x) => x.name);
    const originalCredentials = await this.toolsCredentialRepository.find({
      where: {
        namespace,
        isDeleted: false,
      },
    });
    const originalCredentialNames = originalCredentials.map((x) => x.name);
    const credentialsToDelete = originalCredentials.filter((x) => !latestCredentialNames.includes(x.name));
    const credentialsToCreate = latestCredentials.filter((x) => !originalCredentialNames.includes(x.name));
    const credentialsToUpdate = originalCredentials.filter((x) => latestCredentialNames.includes(x.name));

    if (credentialsToCreate.length) {
      const entitiesToCreate: ToolsCredentialEntity[] = credentialsToCreate.map(
        (x): ToolsCredentialEntity => ({
          id: new ObjectId(),
          isDeleted: false,
          createdTimestamp: +new Date(),
          updatedTimestamp: +new Date(),
          type: x.type,
          namespace: namespace,
          name: x.name,
          displayName: x.displayName,
          description: x.description,
          icon: x.icon,
          properties: x.properties,
        }),
      );
      await this.toolsCredentialRepository.save(entitiesToCreate);
    }

    if (credentialsToDelete.length) {
      await this.toolsCredentialRepository.update(
        {
          namespace,
          name: In(credentialsToDelete.map((x) => x.name)),
        },
        {
          isDeleted: true,
        },
      );
    }

    if (credentialsToUpdate.length) {
      const entitiesToUpdate = credentialsToUpdate.map((x): ToolsCredentialEntity => {
        const latestDef = latestCredentials.find((t) => x.name === t.name);
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
      await this.toolsCredentialRepository.save(entitiesToUpdate);
    }
  }

  public async createOrUpdateTools(namespace: string, latestTools: BlockDefinition[]) {
    const latestToolNames = latestTools.map((x) => x.name);
    const originalTools = await this.toolsRepository.find({
      where: {
        namespace,
        isDeleted: false,
      },
    });
    const originalToolNames = originalTools.map((x) => x.name);
    const toolsToDelete = originalTools.filter((x) => !latestToolNames.includes(x.name));
    const toolsToCreate = latestTools.filter((x) => !originalToolNames.includes(x.name));
    const toolsToUpdate = originalTools.filter((x) => latestToolNames.includes(x.name));

    if (toolsToCreate.length) {
      const entitiesToCreate: ToolsEntity[] = toolsToCreate.map(
        (x): ToolsEntity => ({
          id: new ObjectId(),
          isDeleted: false,
          createdTimestamp: +new Date(),
          updatedTimestamp: +new Date(),
          type: BlockType.SIMPLE,
          namespace: namespace,
          name: x.name,
          displayName: x.displayName,
          description: x.description,
          categories: x.categories,
          credentials: x.credentials,
          icon: x.icon,
          input: x.input,
          output: x.output,
          rules: x.rules,
          extra: x.extra,
        }),
      );
      await this.toolsRepository.save(entitiesToCreate);
    }

    if (toolsToDelete.length) {
      await this.toolsRepository.update(
        {
          namespace,
          name: In(toolsToDelete.map((x) => x.name)),
        },
        {
          isDeleted: true,
        },
      );
    }

    if (toolsToUpdate.length) {
      const entitiesToUpdate = toolsToUpdate.map((x): ToolsEntity => {
        const latestDef = latestTools.find((t) => x.name === t.name);
        return {
          ...x,
          id: x.id,
          updatedTimestamp: +new Date(),
          displayName: latestDef.displayName,
          description: latestDef.description,
          categories: latestDef.categories,
          icon: latestDef.icon,
          input: latestDef.input,
          output: latestDef.output,
          rules: latestDef.rules,
          extra: latestDef.extra,
        };
      });
      await this.toolsRepository.save(entitiesToUpdate);
    }
  }

  public async listTools() {
    return await this.toolsRepository.find({
      where: {
        isDeleted: false,
      },
    });
  }

  public async getToolByName(name: string) {
    return await this.toolsRepository.findOne({
      where: {
        name,
        isDeleted: true,
      },
    });
  }
}
