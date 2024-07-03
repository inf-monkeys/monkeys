import { config } from '@/common/config';
import { logger } from '@/common/logger';
import { generateOneApiTokenByUsernamePassword } from '@/common/oneapi';
import { generateDbId, maskString } from '@/common/utils';
import { SystemConfigurationEntity } from '@/database/entities/system/system-configuration.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import crypto from 'crypto';
import { Repository } from 'typeorm';

@Injectable()
export class SystemConfigurationRepository {
  private THEME_CONFIG_KEY = 'theme';
  private AES_ENCRYPT_KEY = 'aesEncryptKey';
  private ONEAPI_ROOT_USER_TOKEN_KEY = 'oneapiRootUserToken';

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

  public async getOneApiRootUserToken() {
    const configuration = await this.systemConfigurationEntity.findOne({
      where: {
        key: this.ONEAPI_ROOT_USER_TOKEN_KEY,
      },
    });
    if (!configuration) {
      throw new Error('UNEXPECTED ERROR: oneapiRootUserToken not found, maybe system not configured properly.');
    }
    return configuration.value;
  }

  public async initOneApiRootUserToken() {
    if (!config.oneapi.enabled) {
      return;
    }

    // If set rootToken in config, allways update it to db
    if (config.oneapi.rootToken) {
      const token = config.oneapi.rootToken;
      const configuration = await this.systemConfigurationEntity.findOne({
        where: {
          key: this.ONEAPI_ROOT_USER_TOKEN_KEY,
        },
      });
      if (configuration) {
        configuration.value = token;
        await this.systemConfigurationEntity.save(configuration);
      } else {
        const entity: SystemConfigurationEntity = {
          id: generateDbId(),
          createdTimestamp: +new Date(),
          updatedTimestamp: +new Date(),
          isDeleted: false,
          key: this.ONEAPI_ROOT_USER_TOKEN_KEY,
          value: token,
        };
        await this.systemConfigurationEntity.save(entity);
      }
    } else {
      // Else, auto generate token first time and save to db
      const configuration = await this.systemConfigurationEntity.findOne({
        where: {
          key: this.ONEAPI_ROOT_USER_TOKEN_KEY,
        },
      });
      if (configuration) {
        return;
      }
      const { rootUsername, rootPassword } = config.oneapi;
      logger.info(`Auto generate oneapi root user token, username=${rootUsername}, password=${maskString(rootPassword)}`);
      const token = await generateOneApiTokenByUsernamePassword(config.oneapi.baseURL, rootUsername, rootPassword);
      const entity: SystemConfigurationEntity = {
        id: generateDbId(),
        createdTimestamp: +new Date(),
        updatedTimestamp: +new Date(),
        isDeleted: false,
        key: this.ONEAPI_ROOT_USER_TOKEN_KEY,
        value: token,
      };
      await this.systemConfigurationEntity.save(entity);
    }
  }
}
