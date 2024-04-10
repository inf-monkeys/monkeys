import { generateDbId } from '@/common/utils';
import { SystemConfigurationEntity } from '@/database/entities/system/system-configuration.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class SystemConfigurationRepository {
  private THEME_CONFIG_KEY = 'theme';
  private AES_ENCRYPT_KEY = 'aesEncryptKey';

  constructor(
    @InjectRepository(SystemConfigurationEntity)
    private readonly systemConfigurationEntity: Repository<SystemConfigurationEntity>,
  ) {}

  public async getAesKey() {
    const configuration = await this.systemConfigurationEntity.findOne({
      where: {
        key: this.AES_ENCRYPT_KEY,
      },
    });
    if (!configuration) {
      throw new Error('UNEXPECTED ERROR: aesEncryptKey not found, maybe system not configured properly.');
    }
    return configuration.value;
  }

  public async initAesKey() {
    if (await this.systemConfigurationEntity.exists({ where: { key: this.AES_ENCRYPT_KEY } })) {
      return;
    }
    const entity: SystemConfigurationEntity = {
      id: generateDbId(),
      createdTimestamp: +new Date(),
      updatedTimestamp: +new Date(),
      isDeleted: false,
      key: this.AES_ENCRYPT_KEY,
      value: crypto.randomBytes(32).toString('hex'),
    };
    await this.systemConfigurationEntity.save(entity);
  }

  public async getThemeConfig() {
    const configuration = await this.systemConfigurationEntity.findOne({
      where: {
        key: this.THEME_CONFIG_KEY,
      },
    });
    if (!configuration) {
      return null;
    }
    return JSON.parse(configuration.value);
  }
}
