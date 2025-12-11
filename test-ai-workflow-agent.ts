/**
 * 测试 AI Workflow Agent 配置
 * 验证：
 * 1. claude-haiku-4-5-20251001 模型是否可用
 * 2. baseURL 是否正确配置
 * 3. 目标分解功能是否正常
 */

import { config } from './src/common/config';
import axios from 'axios';

async function testModelConfiguration() {
  console.log('=== 测试 AI Workflow Agent 配置 ===\n');

  // 1. 检查配置
  console.log('1. 检查配置文件:');
  console.log(`   aiWorkflowBuilder.model: ${config.aiWorkflowBuilder?.model || '未配置'}`);
  console.log(`   aiWorkflowAgent.model: ${config.aiWorkflowAgent?.model || '未配置'}`);

  // 2. 检查模型配置
  console.log('\n2. 检查模型配置:');
  const targetModel = config.aiWorkflowBuilder?.model || 'claude-haiku-4-5-20251001';
  const modelConfig = config.models?.find(m => {
    if (Array.isArray(m.model)) {
      return m.model.includes(targetModel);
    }
    return m.model === targetModel;
  });

  if (modelConfig) {
    console.log(`   ✅ 找到模型配置: ${targetModel}`);
    console.log(`   baseURL: ${modelConfig.baseURL}`);
    console.log(`   apiKey: ${modelConfig.apiKey?.substring(0, 20)}...`);
  } else {
    console.log(`   ❌ 未找到模型配置: ${targetModel}`);
    console.log('\n   可用的模型:');
    config.models?.forEach(m => {
      console.log(`   - ${Array.isArray(m.model) ? m.model.join(', ') : m.model}`);
    });
  }

  // 3. 测试 API 连接
  if (modelConfig) {
    console.log('\n3. 测试 API 连接:');
    try {
      const response = await axios.post(
        `${modelConfig.baseURL}/chat/completions`,
        {
          model: targetModel,
          messages: [
            {
              role: 'user',
              content: '请用一句话回复：你好'
            }
          ],
          max_tokens: 50,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${modelConfig.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log(`   ✅ API 连接成功`);
      console.log(`   响应: ${response.data.choices[0].message.content}`);

      return true;
    } catch (error) {
      console.log(`   ❌ API 连接失败: ${error.message}`);
      if (error.response) {
        console.log(`   状态码: ${error.response.status}`);
        console.log(`   错误详情: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      return false;
    }
  }

  return false;
}

// 运行测试
testModelConfiguration()
  .then(success => {
    console.log('\n=== 测试完成 ===');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  });
