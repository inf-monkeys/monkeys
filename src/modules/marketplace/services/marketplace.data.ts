import { config } from '@/common/config';
import { downloadFileContent } from '@/common/utils/file';
import { I18nValue } from '@inf-monkeys/monkeys';
import { Logger } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import { IStagedAssetWithSnapshot } from '../types';

export interface PresetAppSortPage {
  id: string;
  appId: string;
  assetType: string;
  pageType: string;
}

export interface PresetAppSortGroup {
  id: string;
  displayName: I18nValue | string;
  iconUrl: string;
  pages: PresetAppSortPage[];
}

export type PresetAppSort = PresetAppSortGroup[];
export type PresetAppLocalData = IStagedAssetWithSnapshot;

class MarketplaceDataManager {
  private _presetAppSort: PresetAppSort = [];
  private _presetAllAppIds: string[] = [];
  private _presetAppLocalDataList: PresetAppLocalData[] = [];
  private _logger = new Logger(MarketplaceDataManager.name);

  constructor() {
    this.reload();
  }

  // 获取预设应用排序配置文件路径
  private getPresetAppSortFiles(): string[] {
    if (process.env.MONKEYS_PRESET_APP_SORT_FILE) {
      return [path.resolve(process.env.MONKEYS_PRESET_APP_SORT_FILE)];
    }
    const appPresetAppSortFileList = [path.resolve(`/etc/monkeys/presetAppSort.${config.server.appId}.json`), path.resolve(`./presetAppSort.${config.server.appId}.json`)];
    return appPresetAppSortFileList.some(fs.existsSync) ? appPresetAppSortFileList : [path.resolve('/etc/monkeys/presetAppSort.json'), path.resolve('./presetAppSort.json')];
  }

  // 获取预设应用本地数据文件路径
  private getPresetAppLocalDataFiles(): string[] {
    if (process.env.MONKEYS_PRESET_APP_LOCAL_DATA_FILE) {
      return [path.resolve(process.env.MONKEYS_PRESET_APP_LOCAL_DATA_FILE)];
    }
    const appPresetAppLocalDataFileList = [path.resolve(`/etc/monkeys/presetApp.${config.server.appId}.json`), path.resolve(`./presetApp.${config.server.appId}.json`)];
    return appPresetAppLocalDataFileList.some(fs.existsSync) ? appPresetAppLocalDataFileList : [path.resolve('/etc/monkeys/presetApp.json'), path.resolve('./presetApp.json')];
  }

  // 重载方法
  public async reload(): Promise<boolean> {
    this._logger.log('Reloading marketplace data...');
    try {
      // 尝试从远程URL加载预设应用排序数据
      let presetAppSortContent: string | null = null;
      if (config.server.customization.marketplace?.presetAppSortFileUrl) {
        this._logger.log(`Loading preset app sort data from remote URL: ${config.server.customization.marketplace.presetAppSortFileUrl}`);
        presetAppSortContent = await downloadFileContent(config.server.customization.marketplace.presetAppSortFileUrl);
      }

      // 如果远程加载失败，使用本地文件
      if (!presetAppSortContent) {
        presetAppSortContent =
          this.getPresetAppSortFiles()
            .filter(Boolean)
            .filter(fs.existsSync)
            .map((file) => fs.readFileSync(file, 'utf-8'))[0] || '[]';
      }

      // 解析预设应用排序数据
      this._presetAppSort = JSON.parse(presetAppSortContent);
      this._presetAllAppIds = this._presetAppSort.flatMap((it) => it.pages.map((page) => page.appId));

      // 尝试从远程URL加载预设应用本地数据
      let presetAppLocalDataContent: string | null = null;
      if (config.server.customization.marketplace?.presetAppFileUrl) {
        this._logger.log(`Loading preset app local data from remote URL: ${config.server.customization.marketplace.presetAppFileUrl}`);
        presetAppLocalDataContent = await downloadFileContent(config.server.customization.marketplace.presetAppFileUrl);
      }

      // 如果远程加载失败，使用本地文件
      if (!presetAppLocalDataContent) {
        presetAppLocalDataContent =
          this.getPresetAppLocalDataFiles()
            .filter(Boolean)
            .filter(fs.existsSync)
            .map((file) => fs.readFileSync(file, 'utf-8'))[0] || '[]';
      }

      // 解析预设应用本地数据
      this._presetAppLocalDataList = JSON.parse(presetAppLocalDataContent);

      this._logger.log('Marketplace data reloaded successfully. App ID List: ' + this._presetAllAppIds.join(', '));
      return true;
    } catch (error) {
      this._logger.error('Failed to reload marketplace data:', error);
      return false;
    }
  }

  // Getter 方法
  public get presetAppSort(): PresetAppSort {
    return this._presetAppSort;
  }

  public get presetAllAppIds(): string[] {
    return this._presetAllAppIds;
  }

  public get presetAppLocalDataList(): PresetAppLocalData[] {
    return this._presetAppLocalDataList;
  }
}

export const marketplaceDataManager = new MarketplaceDataManager();
