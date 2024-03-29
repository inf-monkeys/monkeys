import { ToolsServerEntity } from '@/database/entities/tools/tools-server.entity';
import { ToolsEntity } from '@/database/entities/tools/tools.entity';
import { ManifestJson } from '@/modules/tools/interfaces';
import { BlockDefinition } from '@inf-monkeys/vines';
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
        isDeleted: false,
      },
    });
  }

  public async saveServer(displayName: string, manifestUrl: string, baseUrl: string, data: ManifestJson) {
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
    entity.manifestUrl = manifestUrl;
    entity.baseUrl = baseUrl;
    entity.displayName = displayName;
    await this.toolsServerRepository.save(entity);
  }

  public async createOrUpdateTools(namespace: string, latestTools: BlockDefinition[]) {
    const latestToolNames = latestTools.map((x) => x.name);
    const originalTools = await this.toolsRepository.find({
      where: {
        namespace,
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
          type: x.type,
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
          type: latestDef.type,
          isDeleted: false,
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
        isDeleted: false,
      },
    });
  }

  public async listServers() {
    return await this.toolsServerRepository.find({
      where: {
        isDeleted: false,
      },
    });
  }

  public async createTool(tool: ToolsEntity) {
    await this.toolsRepository.save(tool);
  }

  public async updateTool(name: string, updates: Partial<ToolsEntity>) {
    await this.toolsRepository.update(
      {
        name,
        isDeleted: false,
      },
      updates,
    );
  }
}
