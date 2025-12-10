import axios from 'axios';

/**
 * 测试 GPT-5.1 模型是否可用
 */
async function testGPT51() {
  const baseURL = 'https://api.cursorai.art/v1';
  const apiKey = 'sk-QKBfIx4yJGLx3SAcqtwigshaqwnbYX54zuQ6KKFUhuagBo6K';
  const model = 'gpt-5.1';

  console.log('🧪 测试 GPT-5.1 模型连接...\n');
  console.log(`📍 API 地址: ${baseURL}`);
  console.log(`🤖 模型: ${model}\n`);
  console.log('='.repeat(60));

  try {
    const response = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'user',
            content: '请用一句话介绍你自己',
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

    console.log('\n✅ GPT-5.1 模型测试成功！\n');
    console.log('📊 响应信息:');
    console.log(`   模型: ${response.data.model}`);
    console.log(`   Token 使用: ${response.data.usage?.total_tokens || 'N/A'}`);
    console.log('\n💬 模型回复:');
    console.log(`   ${response.data.choices[0].message.content}\n`);
    console.log('='.repeat(60));
    console.log('✅ 结论: GPT-5.1 可以正常使用');

    return true;
  } catch (error: any) {
    console.log('\n❌ GPT-5.1 模型测试失败\n');

    if (error.response) {
      console.log('📊 错误信息:');
      console.log(`   HTTP 状态码: ${error.response.status}`);
      console.log(`   错误消息: ${error.response.data?.error?.message || JSON.stringify(error.response.data)}`);

      // 检查是否是模型不存在的错误
      const errorMsg = error.response.data?.error?.message || '';
      if (errorMsg.includes('model') || errorMsg.includes('not found') || errorMsg.includes('does not exist')) {
        console.log('\n⚠️  可能的原因: API 端点不支持 gpt-5.1 模型');
        console.log('💡 建议: 使用 gpt-5 或 gpt-4o');
      }
    } else if (error.request) {
      console.log('📊 网络错误:');
      console.log(`   ${error.message}`);
      console.log('\n⚠️  可能的原因: 网络连接问题或 API 端点不可达');
    } else {
      console.log('📊 未知错误:');
      console.log(`   ${error.message}`);
    }

    console.log('\n='.repeat(60));
    console.log('❌ 结论: GPT-5.1 暂时无法使用');

    return false;
  }
}

// 运行测试
testGPT51().then((success) => {
  process.exit(success ? 0 : 1);
});
