import { config } from '@/common/config';
import { I18nValue } from '@inf-monkeys/monkeys';
import fs from 'fs';
import path from 'path';

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
