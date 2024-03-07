import { ToolsCredentialEntity } from '@/entities/tools/tools-credential.entity';
import { ToolsServerEntity } from '@/entities/tools/tools-server.entity';
import { ToolsEntity } from '@/entities/tools/tools.entity';
import { ManifestJson } from '@/modules/worker/interfaces';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { Repository } from 'typeorm';

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

    // save credentials
    if (data.credentials) {
      for (const credential of data.credentials) {
        const credentialEntity = new ToolsCredentialEntity();
        credentialEntity.description = credential.description;
        credentialEntity.displayName = credential.displayName;
        credentialEntity.name = credential.name;
        await this.toolsCredentialRepository.save(credential);
      }
    }
  }

  public async saveTools() {}

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
