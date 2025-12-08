import axios from 'axios';

/**
 * 测试多个 GPT 模型的可用性
 */
async function testModels() {
  const baseURL = 'https://api.cursorai.art/v1';
  const apiKey = 'sk-QKBfIx4yJGLx3SAcqtwigshaqwnbYX54zuQ6KKFUhuagBo6K';

  const modelsToTest = ['gpt-4o', 'gpt-5', 'gpt-5.1', 'gpt-5-preview'];

  console.log('🧪 测试多个 GPT 模型的可用性\n');
  console.log('='.repeat(80));

  const results: Record<string, { success: boolean; message: string; model?: string }> = {};

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
              content: '你好',
            },
          ],
          temperature: 0.7,
          max_tokens: 50,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: 30000,
        },
      );

      results[model] = {
        success: true,
        message: `✅ 可用 (返回模型: ${response.data.model})`,
        model: response.data.model,
      };
      console.log(`   ✅ 成功`);
      console.log(`   返回模型: ${response.data.model}`);
      console.log(`   Token 使用: ${response.data.usage?.total_tokens || 'N/A'}`);

      // 延迟避免触发限流
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const errorMsg = error.response.data?.error?.message || '';

        if (status === 429) {
          results[model] = {
            success: false,
            message: `⚠️  限流 (HTTP 429) - 可能需要等待或模型不存在`,
          };
          console.log(`   ⚠️  HTTP 429 - 请求限流`);
        } else if (status === 404 || errorMsg.includes('model') || errorMsg.includes('not found')) {
          results[model] = {
            success: false,
            message: `❌ 模型不存在 (${errorMsg})`,
          };
          console.log(`   ❌ 模型不存在: ${errorMsg}`);
        } else {
          results[model] = {
            success: false,
            message: `❌ 错误 (HTTP ${status}): ${errorMsg}`,
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
    .map(([model, result]) => ({ model, returnedModel: result.model }));

  const unavailableModels = Object.entries(results)
    .filter(([_, result]) => !result.success)
    .map(([model, result]) => ({ model, reason: result.message }));

  console.log('✅ 可用模型:');
  if (availableModels.length === 0) {
    console.log('   (无)');
  } else {
    availableModels.forEach(({ model, returnedModel }) => {
      console.log(`   - ${model}${returnedModel !== model ? ` (实际返回: ${returnedModel})` : ''}`);
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

  if (availableModels.length > 0) {
    console.log(`\n💡 建议使用: ${availableModels[0].model}`);
  }

  return availableModels.length > 0;
}

// 运行测试
testModels().then((hasAvailable) => {
  process.exit(hasAvailable ? 0 : 1);
});
