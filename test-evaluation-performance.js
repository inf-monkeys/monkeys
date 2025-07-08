#!/usr/bin/env node

/**
 * 评测状态接口性能测试脚本
 * 用于测试缓存层的性能提升效果
 */

const http = require('http');

// 配置项
const CONFIG = {
  host: 'localhost',
  port: 3000,
  teamId: 'your-team-id',           // 请替换为实际的teamId
  moduleId: 'your-module-id',       // 请替换为实际的moduleId
  authToken: 'your-auth-token',     // 请替换为实际的token
  testRounds: 5,                    // 测试轮数
  intervalMs: 1000,                 // 每次请求间隔（毫秒）
};

// 发起HTTP请求的函数
function makeRequest(url, headers) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const req = http.request(url, { method: 'GET', headers }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        try {
          const result = JSON.parse(data);
          resolve({
            success: true,
            responseTime,
            statusCode: res.statusCode,
            data: result
          });
        } catch (error) {
          reject(new Error(`JSON parse error: ${error.message}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// 清理缓存的函数（通过添加资产触发缓存清理）
async function clearCache() {
  console.log('🗑️  尝试清理缓存...');
  // 这里可以调用一个会触发缓存清理的操作
  // 例如：添加一个资产或者等待自动评测完成
  await new Promise(resolve => setTimeout(resolve, 2000));
}

// 主测试函数
async function runPerformanceTest() {
  console.log('🚀 开始评测状态接口性能测试\n');
  console.log(`配置: ${CONFIG.testRounds}轮测试，每次间隔${CONFIG.intervalMs}ms\n`);
  
  const url = `http://${CONFIG.host}:${CONFIG.port}/evaluation/modules/${CONFIG.moduleId}/evaluation-status`;
  const headers = {
    'Authorization': `Bearer ${CONFIG.authToken}`,
    'Content-Type': 'application/json'
  };
  
  const results = [];
  
  for (let round = 1; round <= CONFIG.testRounds; round++) {
    console.log(`🔄 第 ${round} 轮测试:`);
    
    try {
      const result = await makeRequest(url, headers);
      results.push(result);
      
      console.log(`   ✅ 响应时间: ${result.responseTime}ms`);
      console.log(`   📊 状态码: ${result.statusCode}`);
      
      if (result.data && result.data.data) {
        const { isComplete, progress, totalAssets } = result.data.data;
        console.log(`   📈 进度: ${progress}% | 完成: ${isComplete} | 资产数: ${totalAssets}`);
      }
      
    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`);
      results.push({ success: false, error: error.message });
    }
    
    console.log('');
    
    // 等待间隔时间
    if (round < CONFIG.testRounds) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.intervalMs));
    }
  }
  
  // 分析结果
  console.log('📈 性能分析结果:');
  console.log('================');
  
  const successResults = results.filter(r => r.success);
  if (successResults.length === 0) {
    console.log('❌ 没有成功的请求');
    return;
  }
  
  const responseTimes = successResults.map(r => r.responseTime);
  const avgTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
  const minTime = Math.min(...responseTimes);
  const maxTime = Math.max(...responseTimes);
  
  console.log(`平均响应时间: ${avgTime}ms`);
  console.log(`最快响应时间: ${minTime}ms`);
  console.log(`最慢响应时间: ${maxTime}ms`);
  console.log(`成功率: ${successResults.length}/${CONFIG.testRounds} (${Math.round(successResults.length/CONFIG.testRounds*100)}%)`);
  
  // 性能评估
  console.log('\n🎯 性能评估:');
  if (minTime < 200) {
    console.log('✅ 检测到快速响应 (< 200ms) - 可能命中缓存');
  }
  if (maxTime > 2000) {
    console.log('⚠️  检测到慢速响应 (> 2s) - 可能是缓存未命中');
  }
  
  const timeDiff = maxTime - minTime;
  if (timeDiff > 1000) {
    console.log(`📊 响应时间差异较大 (${timeDiff}ms) - 缓存效果明显`);
  }
}

// 使用说明
function printUsage() {
  console.log('📝 使用说明:');
  console.log('1. 修改脚本中的CONFIG配置项 (teamId, moduleId, authToken)');
  console.log('2. 确保服务器正在运行');
  console.log('3. 运行: node test-evaluation-performance.js');
  console.log('');
  console.log('💡 观察技巧:');
  console.log('- 第一次请求通常较慢 (缓存未命中)');
  console.log('- 后续30秒内的请求应该很快 (缓存命中)');
  console.log('- 检查服务器日志查看详细的缓存命中情况');
  console.log('');
}

// 检查配置
if (CONFIG.teamId === 'your-team-id' || CONFIG.moduleId === 'your-module-id') {
  printUsage();
  console.log('❌ 请先配置 teamId 和 moduleId');
  process.exit(1);
}

// 运行测试
runPerformanceTest().catch(error => {
  console.error('💥 测试失败:', error);
  process.exit(1);
});