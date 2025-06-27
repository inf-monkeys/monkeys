const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:33002';
const TOKEN = 'your-tenant-bearer-token'; // 需要替换为实际的 token

async function testTenantOutputs() {
  try {
    console.log('测试 POST /api/tenant/outputs...');
    
    const response = await axios.post(`${BASE_URL}/api/tenant/outputs`, {
      page: 1,
      limit: 5,
      // 测试 searchableText 搜索
      searchableText: 'test',
      // 测试 extraMetadata 数组查询
      extraMetadata: {
        category: ['image', 'text']
      }
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    // 验证新字段结构
    if (response.data.data && response.data.data.length > 0) {
      const firstItem = response.data.data[0];
      console.log('\n验证新字段结构:');
      console.log('✓ workflowId:', !!firstItem.workflowId);
      console.log('✓ workflowInstanceId:', !!firstItem.workflowInstanceId);
      console.log('✓ input (数组):', Array.isArray(firstItem.input));
      console.log('✓ rawInput:', !!firstItem.rawInput);
      console.log('✓ output (数组):', Array.isArray(firstItem.output));
      console.log('✓ rawOutput:', !!firstItem.rawOutput);
      console.log('✓ extraMetadata:', !!firstItem.extraMetadata);
      console.log('✓ searchableText:', !!firstItem.searchableText);
    }
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

async function testTeamWorkflowExecutions() {
  try {
    console.log('\n测试 POST /api/tenant/teams/:teamId/workflow-executions/search...');
    
    const teamId = 'your-team-id'; // 需要替换为实际的 teamId
    
    const response = await axios.post(`${BASE_URL}/api/tenant/teams/${teamId}/workflow-executions/search`, {
      pagination: {
        page: 1,
        limit: 5
      },
      orderBy: {
        field: 'startTime',
        order: 'DESC'
      }
    }, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('响应状态:', response.status);
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    // 验证新字段结构
    if (response.data.data && response.data.data.length > 0) {
      const firstItem = response.data.data[0];
      console.log('\n验证新字段结构:');
      console.log('✓ workflowId:', !!firstItem.workflowId);
      console.log('✓ workflowInstanceId:', !!firstItem.workflowInstanceId);
      console.log('✓ input (数组):', Array.isArray(firstItem.input));
      console.log('✓ rawInput:', !!firstItem.rawInput);
      console.log('✓ output (数组):', Array.isArray(firstItem.output));
      console.log('✓ rawOutput:', !!firstItem.rawOutput);
      console.log('✓ extraMetadata:', !!firstItem.extraMetadata);
      console.log('✓ searchableText:', !!firstItem.searchableText);
    }
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
async function runTests() {
  console.log('开始测试 Tenant API 字段升级...\n');
  
  await testTenantOutputs();
  await testTeamWorkflowExecutions();
  
  console.log('\n测试完成！');
}

runTests(); 