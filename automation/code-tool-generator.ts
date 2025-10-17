import * as fs from 'fs';
import * as path from 'path';

interface CodeToolGeneratorConfig {
  sourceCode: string;
  language: 'python' | 'javascript' | 'typescript' | 'java' | 'go';
  namespace: string;
  displayName: string;
  description?: string;
  inputSchema?: any;
  outputSchema?: any;
}

export class CodeToolGenerator {
  async generateTool(config: CodeToolGeneratorConfig) {
    // 1. 分析代码结构
    const codeAnalysis = this.analyzeCode(config.sourceCode, config.language);
    
    // 2. 生成 manifest.json
    const manifest = this.generateManifest(config, codeAnalysis);
    
    // 3. 生成 Dockerfile
    const dockerfile = this.generateDockerfile(config.language);
    
    // 4. 生成工具服务代码
    const toolService = this.generateToolService(config, codeAnalysis);
    
    // 5. 生成 OpenAPI 规范
    const openApiSpec = this.generateOpenAPISpec(config, codeAnalysis);
    
    return {
      manifest,
      dockerfile,
      toolService,
      openApiSpec
    };
  }

  private analyzeCode(sourceCode: string, language: string) {
    // 这里可以使用 AST 解析器来分析代码结构
    // 提取函数、参数、返回值等信息
    return {
      functions: this.extractFunctions(sourceCode, language),
      dependencies: this.extractDependencies(sourceCode, language),
      entryPoints: this.findEntryPoints(sourceCode, language)
    };
  }

  private extractFunctions(sourceCode: string, language: string) {
    // 根据语言类型提取函数定义
    const functions = [];
    
    if (language === 'python') {
      // 使用正则表达式或 AST 解析器提取 Python 函数
      const functionRegex = /def\s+(\w+)\s*\(([^)]*)\)\s*:?/g;
      let match;
      while ((match = functionRegex.exec(sourceCode)) !== null) {
        functions.push({
          name: match[1],
          parameters: this.parseParameters(match[2]),
          returnType: this.inferReturnType(sourceCode, match[1])
        });
      }
    } else if (language === 'javascript' || language === 'typescript') {
      // 提取 JavaScript/TypeScript 函数
      const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*\([^)]*\)\s*=>|async\s+function\s+(\w+))/g;
      let match;
      while ((match = functionRegex.exec(sourceCode)) !== null) {
        const functionName = match[1] || match[2] || match[3];
        functions.push({
          name: functionName,
          parameters: this.parseParameters(match[0]),
          returnType: this.inferReturnType(sourceCode, functionName)
        });
      }
    }
    
    return functions;
  }

  private extractDependencies(sourceCode: string, language: string) {
    const dependencies = [];
    
    if (language === 'python') {
      // 提取 Python import 语句
      const importRegex = /(?:from\s+(\w+)\s+import|import\s+(\w+))/g;
      let match;
      while ((match = importRegex.exec(sourceCode)) !== null) {
        dependencies.push(match[1] || match[2]);
      }
    } else if (language === 'javascript' || language === 'typescript') {
      // 提取 JavaScript/TypeScript import 语句
      const importRegex = /import\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(sourceCode)) !== null) {
        dependencies.push(match[1]);
      }
    }
    
    return dependencies;
  }

  private findEntryPoints(sourceCode: string, language: string) {
    const entryPoints = [];
    
    if (language === 'python') {
      // 查找 Python 的 main 函数或顶级代码
      if (sourceCode.includes('if __name__ == "__main__":')) {
        entryPoints.push('main');
      }
    } else if (language === 'javascript' || language === 'typescript') {
      // 查找 JavaScript/TypeScript 的导出函数
      const exportRegex = /export\s+(?:default\s+)?(?:function\s+)?(\w+)/g;
      let match;
      while ((match = exportRegex.exec(sourceCode)) !== null) {
        entryPoints.push(match[1]);
      }
    }
    
    return entryPoints;
  }

  private parseParameters(paramString: string) {
    return paramString.split(',').map(param => {
      const trimmed = param.trim();
      const [name, type] = trimmed.split(':').map(s => s.trim());
      return { name, type: type || 'any' };
    }).filter(param => param.name);
  }

  private inferReturnType(sourceCode: string, functionName: string) {
    // 简单的返回类型推断
    if (sourceCode.includes('return true') || sourceCode.includes('return false')) {
      return 'boolean';
    }
    if (sourceCode.includes('return []') || sourceCode.includes('return {}')) {
      return 'object';
    }
    if (sourceCode.includes('return ""') || sourceCode.includes('return \'\'')) {
      return 'string';
    }
    if (sourceCode.includes('return 0') || sourceCode.includes('return 1')) {
      return 'number';
    }
    return 'any';
  }

  private generateManifest(config: CodeToolGeneratorConfig, codeAnalysis: any) {
    return {
      schema_version: 'v1',
      display_name: config.displayName,
      namespace: config.namespace,
      auth: {
        type: 'none'
      },
      api: {
        type: 'openapi',
        url: '/openapi.json'
      },
      contact_email: 'auto-generated@monkeys.ai',
      healthCheck: '/health'
    };
  }

  private generateDockerfile(language: string) {
    const baseImages = {
      python: 'python:3.9-alpine',
      javascript: 'node:18-alpine',
      typescript: 'node:18-alpine',
      java: 'openjdk:11-jre-alpine',
      go: 'golang:1.19-alpine'
    };

    const baseImage = baseImages[language] || 'node:18-alpine';

    if (language === 'python') {
      return `FROM ${baseImage}

WORKDIR /app

# 复制依赖文件
COPY requirements.txt ./
RUN pip install -r requirements.txt

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["python", "app.py"]`;
    } else if (language === 'javascript' || language === 'typescript') {
      return `FROM ${baseImage}

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm install

# 复制源代码
COPY . .

# 如果是 TypeScript，需要编译
${language === 'typescript' ? 'RUN npm run build' : ''}

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]`;
    }

    return `FROM ${baseImage}

WORKDIR /app

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["echo", "Language ${language} not fully supported yet"]`;
  }

  private generateToolService(config: CodeToolGeneratorConfig, codeAnalysis: any) {
    if (config.language === 'python') {
      return this.generatePythonService(config, codeAnalysis);
    } else if (config.language === 'javascript' || config.language === 'typescript') {
      return this.generateNodeService(config, codeAnalysis);
    }
    
    return this.generateGenericService(config, codeAnalysis);
  }

  private generatePythonService(config: CodeToolGeneratorConfig, codeAnalysis: any) {
    return `from flask import Flask, request, jsonify
import json
import sys
import os

# 导入用户代码
${codeAnalysis.dependencies.map(dep => f'import {dep}').join('\n')}

app = Flask(__name__)

# 用户代码
${config.sourceCode}

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})

@app.route('/manifest.json', methods=['GET'])
def get_manifest():
    manifest = {
        "schema_version": "v1",
        "display_name": "${config.displayName}",
        "namespace": "${config.namespace}",
        "auth": {"type": "none"},
        "api": {"type": "openapi", "url": "/openapi.json"},
        "contact_email": "auto-generated@monkeys.ai",
        "healthCheck": "/health"
    }
    return jsonify(manifest)

@app.route('/openapi.json', methods=['GET'])
def get_openapi():
    openapi_spec = {
        "openapi": "3.0.0",
        "info": {
            "title": "${config.displayName}",
            "description": "${config.description || ''}",
            "version": "1.0.0"
        },
        "paths": {
            "/execute": {
                "post": {
                    "summary": "Execute ${config.displayName}",
                    "requestBody": {
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": ${JSON.stringify(config.inputSchema || {})}
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Success",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": ${JSON.stringify(config.outputSchema || {})}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return jsonify(openapi_spec)

@app.route('/execute', methods=['POST'])
def execute():
    try:
        data = request.get_json()
        
        # 调用用户代码中的主要函数
        ${codeAnalysis.entryPoints.length > 0 ? `result = ${codeAnalysis.entryPoints[0]}(**data)` : 'result = {"message": "No entry point found"}'}
        
        return jsonify({
            "success": True,
            "data": result
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000)`;
  }

  private generateNodeService(config: CodeToolGeneratorConfig, codeAnalysis: any) {
    return `const express = require('express');
const app = express();

app.use(express.json());

// 用户代码
${config.sourceCode}

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// 提供 manifest
app.get('/manifest.json', (req, res) => {
  const manifest = {
    schema_version: 'v1',
    display_name: '${config.displayName}',
    namespace: '${config.namespace}',
    auth: { type: 'none' },
    api: { type: 'openapi', url: '/openapi.json' },
    contact_email: 'auto-generated@monkeys.ai',
    healthCheck: '/health'
  };
  res.json(manifest);
});

// 提供 OpenAPI 规范
app.get('/openapi.json', (req, res) => {
  const openapiSpec = {
    openapi: '3.0.0',
    info: {
      title: '${config.displayName}',
      description: '${config.description || ''}',
      version: '1.0.0'
    },
    paths: {
      '/execute': {
        post: {
          summary: 'Execute ${config.displayName}',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: ${JSON.stringify(config.inputSchema || {})}
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: ${JSON.stringify(config.outputSchema || {})}
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  res.json(openapiSpec);
});

// 执行端点
app.post('/execute', async (req, res) => {
  try {
    const data = req.body;
    
    // 调用用户代码中的主要函数
    ${codeAnalysis.entryPoints.length > 0 ? `const result = await ${codeAnalysis.entryPoints[0]}(data);` : 'const result = { message: "No entry point found" };'}
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(3000, () => {
  console.log('Tool service started on port 3000');
});`;
  }

  private generateGenericService(config: CodeToolGeneratorConfig, codeAnalysis: any) {
    return `// Generic service template for ${config.language}
// This is a placeholder - you'll need to implement the actual service

const manifest = {
  schema_version: 'v1',
  display_name: '${config.displayName}',
  namespace: '${config.namespace}',
  auth: { type: 'none' },
  api: { type: 'openapi', url: '/openapi.json' },
  contact_email: 'auto-generated@monkeys.ai',
  healthCheck: '/health'
};

// TODO: Implement service for ${config.language}
console.log('Service template generated for ${config.language}');
console.log('User code:', ${JSON.stringify(config.sourceCode.substring(0, 100))}...);`;
  }

  private generateOpenAPISpec(config: CodeToolGeneratorConfig, codeAnalysis: any) {
    return {
      openapi: '3.0.0',
      info: {
        title: config.displayName,
        description: config.description || '',
        version: '1.0.0'
      },
      paths: {
        '/execute': {
          post: {
            summary: `Execute ${config.displayName}`,
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: config.inputSchema || {}
                  }
                }
              }
            },
            responses: {
              200: {
                description: 'Success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: config.outputSchema || {}
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
  }
}

