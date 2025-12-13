const { Client } = require('pg');
const yaml = require('js-yaml');
const fs = require('fs');

async function checkViews() {
  // 读取配置
  const config = yaml.load(fs.readFileSync('config.bsd.yaml', 'utf8'));

  const client = new Client({
    host: config.database.host,
    port: config.database.port,
    user: config.database.username,
    password: config.database.password,
    database: config.database.database,
  });

  try {
    await client.connect();

    console.log('=== 检查所有表 ===');
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE '%view%'
      ORDER BY table_name
    `);
    console.log('包含 view 的表:');
    console.table(tables.rows);

    console.log('\n=== 检查所有视图 ===');
    const allViews = await client.query(`
      SELECT id, name, is_public, is_deleted, team_id, parent_id
      FROM monkeys_data_views
      ORDER BY created_timestamp DESC
      LIMIT 20
    `);
    console.log('总视图数:', allViews.rowCount);
    console.table(allViews.rows);

    console.log('\n=== 检查公开的视图 ===');
    const publicViews = await client.query(`
      SELECT id, name, is_public, is_deleted, team_id
      FROM monkeys_data_views
      WHERE is_deleted = false AND is_public = true
      ORDER BY created_timestamp DESC
      LIMIT 20
    `);
    console.log('公开视图数:', publicViews.rowCount);
    console.table(publicViews.rows);

  } catch (error) {
    console.error('查询失败:', error.message);
  } finally {
    await client.end();
  }
}

checkViews();
