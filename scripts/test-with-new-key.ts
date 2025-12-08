import axios from 'axios';

/**
 * 使用新 API key 测试 GPT 模型
 */
async function testModelsWithNewKey() {
  const baseURL = 'https://api.cursorai.art/v1';
  const apiKey = 'sk-lUIpTRRqFhS7LQFl75JcZmJqbEEYbZbMr51YGWvQwsdw2Yee';

  const modelsToTest = ['gpt-4o', 'gpt-5', 'gpt-5.1', 'gpt-5-preview'];

  console.log('🧪 使用新 API key 测试多个 GPT 模型\n');
  console.log('🔑 API Key: sk-lUIpTRRqFhS7LQFl75JcZmJq...');
  console.log('='.repeat(80));

  const results: Record<string, { success: boolean; message: string; model?: string; response?: string }> = {};

  for (const model of modelsToTest) {
    console.log(`\n📍 测试模型: ${model}`);
    console.log('-'.repeat(80));

    try {
      const response = await axios.post(
        `${baseURL}/chat/completions`,
        {
          model: model,
          messages: [
            {
              role: 'user',
              content: '你好，请简单介绍一下你自己',
            },
          ],
          temperature: 0.7,
          max_tokens: 100,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
        },
      );

      const content = response.data.choices[0].message.content;
      results[model] = {
        success: true,
        message: `✅ 可用`,
        model: response.data.model,
        response: content,
      };
      console.log(`   ✅ 成功`);
      console.log(`   返回模型: ${response.data.model}`);
      console.log(`   Token 使用: ${response.data.usage?.total_tokens || 'N/A'}`);
      console.log(`   回复内容: ${content.substring(0, 80)}${content.length > 80 ? '...' : ''}`);

      // 延迟避免触发限流
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const errorMsg = error.response.data?.error?.message || JSON.stringify(error.response.data);

        if (status === 429) {
          results[model] = {
            success: false,
            message: `⚠️  限流 (HTTP 429)`,
          };
          console.log(`   ⚠️  HTTP 429 - 请求限流`);
          console.log(`   错误详情: ${errorMsg}`);
        } else if (status === 404 || errorMsg.includes('model') || errorMsg.includes('not found')) {
          results[model] = {
            success: false,
            message: `❌ 模型不存在`,
          };
          console.log(`   ❌ 模型不存在: ${errorMsg}`);
        } else if (status === 401 || status === 403) {
          results[model] = {
            success: false,
            message: `❌ 认证失败 (HTTP ${status})`,
          };
          console.log(`   ❌ 认证失败: ${errorMsg}`);
        } else {
          results[model] = {
            success: false,
            message: `❌ 错误 (HTTP ${status})`,
          };
          console.log(`   ❌ HTTP ${status}: ${errorMsg}`);
        }
      } else {
        results[model] = {
          success: false,
          message: `❌ 网络错误: ${error.message}`,
        };
        console.log(`   ❌ 网络错误: ${error.message}`);
      }

      // 延迟避免触发限流
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 汇总结果
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 测试结果汇总\n');

  const availableModels = Object.entries(results)
    .filter(([_, result]) => result.success)
    .map(([model, result]) => ({
      model,
      returnedModel: result.model,
      response: result.response
    }));

  const unavailableModels = Object.entries(results)
    .filter(([_, result]) => !result.success)
    .map(([model, result]) => ({ model, reason: result.message }));

  console.log('✅ 可用模型:');
  if (availableModels.length === 0) {
    console.log('   (无)');
  } else {
    availableModels.forEach(({ model, returnedModel, response }) => {
      console.log(`   - ${model}${returnedModel !== model ? ` (实际返回: ${returnedModel})` : ''}`);
      if (response) {
        console.log(`     回复: ${response.substring(0, 60)}${response.length > 60 ? '...' : ''}`);
      }
    });
  }

  console.log('\n❌ 不可用模型:');
  if (unavailableModels.length === 0) {
    console.log('   (无)');
  } else {
    unavailableModels.forEach(({ model, reason }) => {
      console.log(`   - ${model}: ${reason}`);
    });
  }

  console.log('\n' + '='.repeat(80));

  // 重点检查 gpt-5.1
  if (results['gpt-5.1']?.success) {
    console.log('\n🎉 好消息！gpt-5.1 可用！');
    console.log(`💡 建议使用: gpt-5.1`);
  } else if (results['gpt-5']?.success) {
    console.log(`\n💡 gpt-5.1 不可用，但 gpt-5 可用`);
    console.log(`💡 建议使用: gpt-5`);
  } else if (availableModels.length > 0) {
    console.log(`\n💡 建议使用: ${availableModels[0].model}`);
  }

  return availableModels.length > 0;
}

// 运行测试
testModelsWithNewKey().then((hasAvailable) => {
  process.exit(hasAvailable ? 0 : 1);
});
