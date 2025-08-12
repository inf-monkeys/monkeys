import { config } from '@/common/config';
import { I18nValue } from '@inf-monkeys/monkeys';
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

let rawPresetAppSortList = [];
if (process.env.MONKEYS_PRESET_APP_SORT_FILE) {
  rawPresetAppSortList = [path.resolve(process.env.MONKEYS_PRESET_APP_SORT_FILE)];
} else {
  const appPresetAppSortFileList = [path.resolve(`/etc/monkeys/presetAppSort.${config.server.appId}.json`), path.resolve(`./presetAppSort.${config.server.appId}.json`)];
  rawPresetAppSortList = appPresetAppSortFileList.some(fs.existsSync) ? appPresetAppSortFileList : [path.resolve('/etc/monkeys/presetAppSort.json'), path.resolve('./presetAppSort.json')];
}

export const presetAppSort: PresetAppSort = JSON.parse(
  rawPresetAppSortList
    .filter(Boolean)
    .filter(fs.existsSync)
    .map((file) => fs.readFileSync(file, 'utf-8'))[0] || `[]`,
);

export const presetAllAppIds = presetAppSort.flatMap((it) => it.pages.map((page) => page.appId));

export type PresetAppLocalData = IStagedAssetWithSnapshot;

let rawPresetAppLocalDataList = [];
if (process.env.MONKEYS_PRESET_APP_LOCAL_DATA_FILE) {
  rawPresetAppLocalDataList = [path.resolve(process.env.MONKEYS_PRESET_APP_LOCAL_DATA_FILE)];
} else {
  const appPresetAppLocalDataFileList = [path.resolve(`/etc/monkeys/presetApp.${config.server.appId}.json`), path.resolve(`./presetApp.${config.server.appId}.json`)];
  rawPresetAppLocalDataList = appPresetAppLocalDataFileList.some(fs.existsSync) ? appPresetAppLocalDataFileList : [path.resolve('/etc/monkeys/presetApp.json'), path.resolve('./presetApp.json')];
}

export const presetAppLocalDataList: PresetAppLocalData[] = JSON.parse(
  rawPresetAppLocalDataList
    .filter(Boolean)
    .filter(fs.existsSync)
    .map((file) => fs.readFileSync(file, 'utf-8'))[0] || `[]`,
);
