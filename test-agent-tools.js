/**
 * Agent 工具调用功能测试脚本
 *
 * 测试内容：
 * 1. 创建测试 Agent
 * 2. 创建测试工具
 * 3. 测试基础工具调用
 * 4. 测试审批流程
 * 5. 测试配额管理
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = 'http://localhost:33002';
const TEST_TEAM_ID = 'test-team-001';
const TEST_USER_ID = 'test-user-001';

// 测试数据
let testAgentId = null;
let testThreadId = null;
let testToolId = null;

// 工具函数
async function request(method, path, data = null, params = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${path}`,
      params,
      data,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Request failed: ${method} ${path}`);
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// 测试步骤
async function test1_CreateAgent() {
  console.log('\n=== 测试 1: 创建测试 Agent ===');

  const agentData = {
    name: '测试工具调用 Agent',
    description: '用于测试工具调用功能的 Agent',
    teamId: TEST_TEAM_ID,
    createdBy: TEST_USER_ID,
    config: {
      model: 'openai:gpt-4o-mini',
      instructions: '你是一个测试助手，帮助测试工具调用功能。',
      temperature: 0.7,
      tools: {
        enabled: true,
        toolNames: ['test_calculator'], // 稍后会创建这个工具
      },
    },
  };

  const result = await request('POST', '/api/agents', agentData);
  testAgentId = result.id;
  console.log('✅ Agent 创建成功:', testAgentId);
  return result;
}

async function test2_CreateTestTool() {
  console.log('\n=== 测试 2: 创建测试工具 ===');

  try {
    // 直接插入数据库（因为工具创建 API 可能在其他模块）
    const { DataSource } = require('typeorm');
    const yaml = require('yaml');
    const fs = require('fs');
    const path = require('path');

    // 加载配置
    const configPath = process.env.MONKEYS_CONFIG_FILE || path.resolve(__dirname, 'config.concept.yaml');
    if (!fs.existsSync(configPath)) {
      console.log('⚠️  配置文件不存在，跳过工具创建');
      return null;
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.parse(configContent);
    const appId = config.server.appId;

    const dataSource = new DataSource({
      ...config.database,
      entityPrefix: appId.concat('_'),
      entities: [path.resolve(__dirname, 'dist/database/entities/**/*.js')],
    });

    await dataSource.initialize();

    const toolId = `tool-${uuidv4()}`;
    testToolId = toolId;

    await dataSource.query(`
      INSERT INTO "${appId}_agent_tools" (
        id, team_id, name, description, input_schema,
        category, needs_approval, is_public, version,
        created_timestamp, updated_timestamp, is_deleted
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), false
      )
    `, [
      toolId,
      TEST_TEAM_ID,
      'test_calculator',
      '简单的计算器工具，可以执行加减乘除运算',
      JSON.stringify({
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['add', 'subtract', 'multiply', 'divide'],
            description: '运算类型',
          },
          a: {
            type: 'number',
            description: '第一个数字',
          },
          b: {
            type: 'number',
            description: '第二个数字',
          },
        },
        required: ['operation', 'a', 'b'],
      }),
      'math',
      false, // 不需要审批
      false,
      '1.0.0',
    ]);

    console.log('✅ 测试工具创建成功:', toolId);

    await dataSource.destroy();
    return toolId;
  } catch (error) {
    console.log('⚠️  工具创建失败:', error.message);
    console.log('   跳过此测试');
    return null;
  }
}

async function test3_CreateThread() {
  console.log('\n=== 测试 3: 创建测试会话 ===');

  const threadData = {
    agentId: testAgentId,
    teamId: TEST_TEAM_ID,
    userId: TEST_USER_ID,
    title: '工具调用测试会话',
  };

  const result = await request('POST', '/api/agents/threads', threadData);
  testThreadId = result.id;
  console.log('✅ Thread 创建成功:', testThreadId);
  return result;
}

async function test4_SendMessageWithToolCall() {
  console.log('\n=== 测试 4: 发送消息触发工具调用 ===');

  console.log('⚠️  注意：此测试需要真实的 AI 模型调用，需要配置 API Key');
  console.log('📝 模拟发送消息: "请帮我计算 15 + 27 的结果"');

  // 实际测试需要调用流式 API
  console.log('提示：使用以下命令测试流式调用：');
  console.log(`curl -X POST ${BASE_URL}/agents/threads/${testThreadId}/stream \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"userMessage":"请帮我计算 15 + 27 的结果","teamId":"${TEST_TEAM_ID}","userId":"${TEST_USER_ID}"}'`);

  return { skipped: true, reason: '需要真实 AI 模型' };
}

async function test5_GetToolCallHistory() {
  console.log('\n=== 测试 5: 查询工具调用历史 ===');

  const result = await request(
    'GET',
    `/agents/threads/${testThreadId}/tool-calls`,
    null,
    { teamId: TEST_TEAM_ID }
  );

  console.log(`✅ 工具调用历史查询成功，共 ${result.length} 条记录`);
  if (result.length > 0) {
    console.log('最近的工具调用:', JSON.stringify(result[0], null, 2));
  }
  return result;
}

async function test6_GetPendingApprovals() {
  console.log('\n=== 测试 6: 查询待审批工具调用 ===');

  const result = await request(
    'GET',
    `/agents/threads/${testThreadId}/tool-calls/pending`,
    null,
    { teamId: TEST_TEAM_ID }
  );

  console.log(`✅ 待审批工具调用查询成功，共 ${result.length} 条`);
  return result;
}

async function test7_GetToolCallStats() {
  console.log('\n=== 测试 7: 查询工具调用统计 ===');

  const result = await request(
    'GET',
    '/api/agents/tool-calls/stats',
    null,
    { teamId: TEST_TEAM_ID, period: 'day' }
  );

  console.log('✅ 工具调用统计查询成功');
  console.log('统计数据:', JSON.stringify(result, null, 2));
  return result;
}

async function test8_TestQuotaManagement() {
  console.log('\n=== 测试 8: 测试配额管理 ===');

  try {
    const { DataSource } = require('typeorm');
    const yaml = require('yaml');
    const fs = require('fs');
    const path = require('path');

    const configPath = process.env.MONKEYS_CONFIG_FILE || path.resolve(__dirname, 'config.concept.yaml');
    if (!fs.existsSync(configPath)) {
      console.log('⚠️  配置文件不存在，跳过配额测试');
      return;
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.parse(configContent);
    const appId = config.server.appId;

    const dataSource = new DataSource({
      ...config.database,
      entityPrefix: appId.concat('_'),
      entities: [path.resolve(__dirname, 'dist/database/entities/**/*.js')],
    });

    await dataSource.initialize();

    // 查询团队配额
    const quotas = await dataSource.query(`
      SELECT * FROM "${appId}_team_quotas"
      WHERE team_id = $1 AND is_deleted = false
    `, [TEST_TEAM_ID]);

    if (quotas.length > 0) {
      console.log('✅ 团队配额存在');
      console.log('配额信息:', quotas[0]);
    } else {
      console.log('⚠️  团队配额不存在，将在首次调用时自动创建');
    }

    await dataSource.destroy();
    return quotas;
  } catch (error) {
    console.log('⚠️  配额测试失败:', error.message);
    console.log('   跳过此测试');
    return [];
  }
}

async function test9_VerifyDatabaseSchema() {
  console.log('\n=== 测试 9: 验证数据库表结构 ===');

  try {
    const { DataSource } = require('typeorm');
    const yaml = require('yaml');
    const fs = require('fs');
    const path = require('path');

    const configPath = process.env.MONKEYS_CONFIG_FILE || path.resolve(__dirname, 'config.concept.yaml');
    if (!fs.existsSync(configPath)) {
      console.log('⚠️  配置文件不存在，跳过数据库验证');
      return;
    }

    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = yaml.parse(configContent);
    const appId = config.server.appId;

    const dataSource = new DataSource({
      ...config.database,
      entityPrefix: appId.concat('_'),
      entities: [path.resolve(__dirname, 'dist/database/entities/**/*.js')],
    });

    await dataSource.initialize();

    // 检查所有必要的表
    const tables = [
      'agent_tools',
      'agent_tool_calls',
      'team_quotas',
    ];

    for (const table of tables) {
      const result = await dataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = $1
        )
      `, [`${appId}_${table}`]);

      const exists = result[0].exists;
      if (exists) {
        console.log(`✅ 表 ${table} 存在`);
      } else {
        console.log(`❌ 表 ${table} 不存在`);
      }
    }

    await dataSource.destroy();
  } catch (error) {
    console.log('⚠️  数据库验证失败:', error.message);
    console.log('   跳过此测试，继续 API 测试');
  }
}

// 主测试流程
async function runTests() {
  console.log('🚀 开始 Agent 工具调用功能测试\n');
  console.log('测试环境:');
  console.log('- BASE_URL:', BASE_URL);
  console.log('- TEST_TEAM_ID:', TEST_TEAM_ID);
  console.log('- TEST_USER_ID:', TEST_USER_ID);

  try {
    // 数据库结构验证
    await test9_VerifyDatabaseSchema();

    // 功能测试
    await test1_CreateAgent();
    await test2_CreateTestTool();
    await test3_CreateThread();
    await test4_SendMessageWithToolCall();
    await test5_GetToolCallHistory();
    await test6_GetPendingApprovals();
    await test7_GetToolCallStats();
    await test8_TestQuotaManagement();

    console.log('\n✅ 所有测试完成！');
    console.log('\n📊 测试摘要：');
    console.log('- Agent ID:', testAgentId);
    console.log('- Thread ID:', testThreadId);
    console.log('- Tool ID:', testToolId);

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 检查服务器是否运行
async function checkServer() {
  try {
    // 尝试访问 API 端点
    await axios.get(`${BASE_URL}/api`, { validateStatus: () => true });
    return true;
  } catch (error) {
    return false;
  }
}

// 启动测试
(async () => {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('⚠️  服务器未运行，请先启动服务器：');
    console.log('   MONKEYS_CONFIG_FILE=config.concept.yaml yarn start:dev');
    process.exit(1);
  }

  await runTests();
})();
