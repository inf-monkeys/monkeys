import { ToolDeploymentAutomation } from './tool-deployment-automation';

async function exampleUsage() {
  const automation = new ToolDeploymentAutomation();

  // 示例 1: 自动化部署 API 工具
  console.log('=== 示例 1: API 工具自动化部署 ===');
  
  try {
    await automation.automateAPIToolDeployment(
      'https://api.example.com', // API URL
      'example_api_tool',        // 命名空间
      '示例 API 工具',            // 显示名称
      {
        targetEnvironment: 'docker',
        registryUrl: 'registry.example.com',
        namespace: 'tools'
      }
    );
  } catch (error) {
    console.error('API 工具部署失败:', error);
  }

  // 示例 2: 自动化部署代码工具
  console.log('\n=== 示例 2: 代码工具自动化部署 ===');
  
  const pythonCode = `
import requests
import json

def analyze_sentiment(text):
    """
    分析文本情感
    """
    # 这里可以集成实际的情感分析 API
    if '好' in text or '棒' in text or '赞' in text:
        return {'sentiment': 'positive', 'score': 0.8}
    elif '坏' in text or '差' in text or '糟' in text:
        return {'sentiment': 'negative', 'score': 0.2}
    else:
        return {'sentiment': 'neutral', 'score': 0.5}

def translate_text(text, target_language='en'):
    """
    翻译文本
    """
    # 这里可以集成实际的翻译 API
    translations = {
        'en': f'Translated: {text}',
        'ja': f'翻訳: {text}',
        'ko': f'번역: {text}'
    }
    return translations.get(target_language, text)
`;

  try {
    await automation.automateCodeToolDeployment(
      pythonCode,                // 源代码
      'python',                  // 语言
      'nlp_tools',              // 命名空间
      'NLP 处理工具',            // 显示名称
      {
        targetEnvironment: 'kubernetes',
        registryUrl: 'registry.example.com',
        namespace: 'ai-tools',
        replicas: 3
      }
    );
  } catch (error) {
    console.error('代码工具部署失败:', error);
  }

  // 示例 3: 注册工具到 Monkeys
  console.log('\n=== 示例 3: 注册工具到 Monkeys ===');
  
  try {
    await automation.registerToolWithMonkeys(
      'http://localhost:3000',   // 工具服务 URL
      'nlp_tools',              // 命名空间
      'NLP 处理工具'             // 显示名称
    );
  } catch (error) {
    console.error('工具注册失败:', error);
  }
}

// 运行示例
exampleUsage().catch(console.error);

