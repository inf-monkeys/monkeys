import { config } from '@/common/config';
import { ComfyuiServerEntity } from '@/entities/comfyui/comfyui-server.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import shortid from 'shortid';
import { Repository } from 'typeorm';

@Injectable()
export class ComfyuiRepository {
  constructor(
    @InjectRepository(ComfyuiServerEntity)
    private readonly comfyuiServerRepository: Repository<ComfyuiServerEntity>,
  ) {}

  public async registerServer(teamId: string, displayName: string, baseUrl: string) {
    const name = shortid.generate();
    const entity: ComfyuiServerEntity = {
      id: new ObjectId(),
      createdTimestamp: +new Date(),
      updatedTimestamp: +new Date(),
      isDeleted: false,
      name,
      displayName,
      baseUrl,
      teamId,
    };
    await this.comfyuiServerRepository.save(entity);
    return name;
  }

  public async createOrUpdateDefaultServer() {
    if (!config.comfyui.baseUrl) {
      return;
    }
    const exists = await this.comfyuiServerRepository.findOne({
      where: {
        name: 'default',
        isDeleted: false,
      },
    });
    if (exists) {
      exists.baseUrl = config.comfyui.baseUrl;
      await this.comfyuiServerRepository.save(exists);
    } else {
      const entity: ComfyuiServerEntity = {
        id: new ObjectId(),
        createdTimestamp: +new Date(),
        updatedTimestamp: +new Date(),
        isDeleted: false,
        name: 'default',
        displayName: 'Default ComfyUI Server',
        baseUrl: config.comfyui.baseUrl,
      };
      await this.comfyuiServerRepository.save(entity);
    }
  }

  public async listComfyuiServers(teamId: string) {
    const defaultServer = await this.comfyuiServerRepository.findOne({
      where: {
        name: 'default',
        isDeleted: false,
      },
    });
    const teamServers = await this.comfyuiServerRepository.find({
      where: {
        teamId,
        isDeleted: false,
      },
    });

    return [...teamServers, defaultServer].filter(Boolean);
  }

  public async getServer(name: string) {
    return await this.comfyuiServerRepository.findOne({
      where: {
        name,
        isDeleted: false,
      },
    });
  }
}
