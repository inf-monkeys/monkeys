import fs from 'fs';
import _ from 'lodash';
import path from 'path';
import * as yaml from 'yaml';

// 解析配置文件
let rawConfigs = [];
if (process.env.MONKEYS_CONFIG_FILE) {
  rawConfigs = [path.resolve(process.env.MONKEYS_CONFIG_FILE)];
} else {
  rawConfigs = [path.resolve('/etc/monkeys/config.yaml'), path.resolve('./config.yaml')];
}

rawConfigs = rawConfigs
  .filter(Boolean)
  .filter(fs.existsSync)
  .map((file) => fs.readFileSync(file, 'utf-8'))
  .map((content) => yaml.parse(content));

const config = [...rawConfigs].reduce((prev, curr) => {
  return _.merge(prev, curr);
});

export const readConfig = (key: string, defaultValue?: any) => {
  const envKey = key
    .split('.')
    .map((x) => x.toUpperCase())
    .join('_');
  return process.env[envKey] || _.get(config, key, defaultValue);
};
