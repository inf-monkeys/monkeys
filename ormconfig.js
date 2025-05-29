const yaml = require('yaml');
const fs = require('fs');
const path = require('path');
const { DataSource } = require('typeorm');
const _ = require('lodash');

const isProd = fs.existsSync(path.join(__dirname, 'dist'));

const migrationsDir = isProd
  ? path.join(__dirname, 'dist', 'database', 'migrations', '*.js')
  : path.join(__dirname, 'src', 'database', 'migrations', '*.ts');

const entitiesDir = isProd
  ? path.join(__dirname, 'dist', 'database', 'entities', '**', '*.js')
  : path.join(__dirname, 'src', 'database', 'entities', '**', '*.ts');

let rawConfigs = [];
if (process.env.MONKEYS_CONFIG_FILE) {
  console.log('Using MONKEYS_CONFIG_FILE:', process.env.MONKEYS_CONFIG_FILE);
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

console.log('Run migration for appId: ', config.server.appId);
const appId = config.server.appId || 'monkeys';
const dataSource = new DataSource({
  ...config.database,
  entityPrefix: appId.concat('_'),
  migrations: [migrationsDir],
  entities: [entitiesDir],
  migrationsTableName: `${appId}_migrations`,
});

module.exports = { dataSource };
