import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { APIToolGenerator } from './api-tool-generator';
import { CodeToolGenerator } from './code-tool-generator';

const execAsync = promisify(exec);

interface DeploymentConfig {
  targetEnvironment: 'local' | 'docker' | 'kubernetes';
  registryUrl?: string;
  namespace?: string;
  replicas?: number;
}

export class ToolDeploymentAutomation {
  private apiGenerator = new APIToolGenerator();
  private codeGenerator = new CodeToolGenerator();

  async automateAPIToolDeployment(
    apiUrl: string,
    namespace: string,
    displayName: string,
    deploymentConfig: DeploymentConfig
  ) {
    console.log(`🚀 开始自动化部署 API 工具: ${displayName}`);

    // 1. 生成工具代码
    const toolArtifacts = await this.apiGenerator.generateTool({
      apiUrl,
      namespace,
      displayName
    });

    // 2. 创建项目目录
    const projectDir = path.join(process.cwd(), 'generated-tools', namespace);
    await this.createProjectDirectory(projectDir);

    // 3. 写入文件
    await this.writeToolFiles(projectDir, toolArtifacts);

    // 4. 部署到目标环境
    await this.deployTool(projectDir, deploymentConfig);

    console.log(`✅ API 工具部署完成: ${displayName}`);
    return {
      projectDir,
      toolArtifacts,
      deploymentConfig
    };
  }

  async automateCodeToolDeployment(
    sourceCode: string,
    language: string,
    namespace: string,
    displayName: string,
    deploymentConfig: DeploymentConfig
  ) {
    console.log(`🚀 开始自动化部署代码工具: ${displayName}`);

    // 1. 生成工具代码
    const toolArtifacts = await this.codeGenerator.generateTool({
      sourceCode,
      language: language as any,
      namespace,
      displayName
    });

    // 2. 创建项目目录
    const projectDir = path.join(process.cwd(), 'generated-tools', namespace);
    await this.createProjectDirectory(projectDir);

    // 3. 写入文件
    await this.writeToolFiles(projectDir, toolArtifacts);

    // 4. 生成依赖文件
    await this.generateDependencyFiles(projectDir, language);

    // 5. 部署到目标环境
    await this.deployTool(projectDir, deploymentConfig);

    console.log(`✅ 代码工具部署完成: ${displayName}`);
    return {
      projectDir,
      toolArtifacts,
      deploymentConfig
    };
  }

  private async createProjectDirectory(projectDir: string) {
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
  }

  private async writeToolFiles(projectDir: string, toolArtifacts: any) {
    // 写入 manifest.json
    fs.writeFileSync(
      path.join(projectDir, 'manifest.json'),
      JSON.stringify(toolArtifacts.manifest, null, 2)
    );

    // 写入 Dockerfile
    fs.writeFileSync(
      path.join(projectDir, 'Dockerfile'),
      toolArtifacts.dockerfile
    );

    // 写入 docker-compose.yml
    fs.writeFileSync(
      path.join(projectDir, 'docker-compose.yml'),
      toolArtifacts.dockerCompose
    );

    // 写入工具服务代码
    if (toolArtifacts.toolService) {
      const serviceFileName = this.getServiceFileName(toolArtifacts);
      fs.writeFileSync(
        path.join(projectDir, serviceFileName),
        toolArtifacts.toolService
      );
    }

    // 写入 OpenAPI 规范
    if (toolArtifacts.openApiSpec) {
      fs.writeFileSync(
        path.join(projectDir, 'openapi.json'),
        JSON.stringify(toolArtifacts.openApiSpec, null, 2)
      );
    }
  }

  private getServiceFileName(toolArtifacts: any): string {
    // 根据语言类型确定服务文件名
    if (toolArtifacts.toolService.includes('from flask import')) {
      return 'app.py';
    } else if (toolArtifacts.toolService.includes('const express')) {
      return 'app.js';
    }
    return 'app.py'; // 默认
  }

  private async generateDependencyFiles(projectDir: string, language: string) {
    if (language === 'python') {
      // 生成 requirements.txt
      const requirements = [
        'flask==2.3.3',
        'requests==2.31.0',
        'python-dotenv==1.0.0'
      ];
      fs.writeFileSync(
        path.join(projectDir, 'requirements.txt'),
        requirements.join('\n')
      );
    } else if (language === 'javascript' || language === 'typescript') {
      // 生成 package.json
      const packageJson = {
        name: path.basename(projectDir),
        version: '1.0.0',
        description: 'Auto-generated tool service',
        main: 'app.js',
        scripts: {
          start: 'node app.js',
          dev: 'nodemon app.js'
        },
        dependencies: {
          express: '^4.18.2',
          axios: '^1.5.0'
        },
        devDependencies: {
          nodemon: '^3.0.1'
        }
      };
      fs.writeFileSync(
        path.join(projectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
    }
  }

  private async deployTool(projectDir: string, deploymentConfig: DeploymentConfig) {
    switch (deploymentConfig.targetEnvironment) {
      case 'local':
        await this.deployToLocal(projectDir);
        break;
      case 'docker':
        await this.deployToDocker(projectDir, deploymentConfig);
        break;
      case 'kubernetes':
        await this.deployToKubernetes(projectDir, deploymentConfig);
        break;
      default:
        throw new Error(`不支持的部署环境: ${deploymentConfig.targetEnvironment}`);
    }
  }

  private async deployToLocal(projectDir: string) {
    console.log('📦 部署到本地环境...');
    
    // 检查是否有 package.json
    const packageJsonPath = path.join(projectDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      console.log('📦 安装 Node.js 依赖...');
      await execAsync('npm install', { cwd: projectDir });
    }

    // 检查是否有 requirements.txt
    const requirementsPath = path.join(projectDir, 'requirements.txt');
    if (fs.existsSync(requirementsPath)) {
      console.log('📦 安装 Python 依赖...');
      await execAsync('pip install -r requirements.txt', { cwd: projectDir });
    }

    console.log('✅ 本地部署完成');
  }

  private async deployToDocker(projectDir: string, config: DeploymentConfig) {
    console.log('🐳 部署到 Docker...');
    
    try {
      // 构建 Docker 镜像
      const imageName = `${config.registryUrl || 'localhost'}/${path.basename(projectDir)}:latest`;
      console.log(`🔨 构建 Docker 镜像: ${imageName}`);
      
      await execAsync(`docker build -t ${imageName} .`, { cwd: projectDir });
      
      // 推送到镜像仓库
      if (config.registryUrl) {
        console.log('📤 推送镜像到仓库...');
        await execAsync(`docker push ${imageName}`);
      }
      
      // 启动容器
      console.log('🚀 启动 Docker 容器...');
      await execAsync(`docker run -d -p 3000:3000 --name ${path.basename(projectDir)} ${imageName}`);
      
      console.log('✅ Docker 部署完成');
    } catch (error) {
      console.error('❌ Docker 部署失败:', error);
      throw error;
    }
  }

  private async deployToKubernetes(projectDir: string, config: DeploymentConfig) {
    console.log('☸️ 部署到 Kubernetes...');
    
    try {
      // 生成 Kubernetes 配置文件
      const k8sConfig = this.generateKubernetesConfig(projectDir, config);
      const k8sConfigPath = path.join(projectDir, 'k8s-deployment.yaml');
      fs.writeFileSync(k8sConfigPath, k8sConfig);
      
      // 应用 Kubernetes 配置
      console.log('📋 应用 Kubernetes 配置...');
      await execAsync(`kubectl apply -f ${k8sConfigPath}`);
      
      // 等待部署完成
      console.log('⏳ 等待部署完成...');
      await execAsync(`kubectl rollout status deployment/${path.basename(projectDir)} -n ${config.namespace || 'default'}`);
      
      console.log('✅ Kubernetes 部署完成');
    } catch (error) {
      console.error('❌ Kubernetes 部署失败:', error);
      throw error;
    }
  }

  private generateKubernetesConfig(projectDir: string, config: DeploymentConfig) {
    const serviceName = path.basename(projectDir);
    const imageName = `${config.registryUrl || 'localhost'}/${serviceName}:latest`;
    
    return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${serviceName}
  namespace: ${config.namespace || 'default'}
spec:
  replicas: ${config.replicas || 1}
  selector:
    matchLabels:
      app: ${serviceName}
  template:
    metadata:
      labels:
        app: ${serviceName}
    spec:
      containers:
      - name: ${serviceName}
        image: ${imageName}
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ${serviceName}-service
  namespace: ${config.namespace || 'default'}
spec:
  selector:
    app: ${serviceName}
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP`;
  }

  async registerToolWithMonkeys(
    toolUrl: string,
    namespace: string,
    displayName: string
  ) {
    console.log('🔗 注册工具到 Monkeys...');
    
    try {
      // 这里应该调用 Monkeys 的 API 来注册工具
      const registrationPayload = {
        importType: 'manifest',
        manifestUrl: `${toolUrl}/manifest.json`
      };
      
      // 模拟注册过程
      console.log('📝 注册信息:', registrationPayload);
      
      // 实际实现中，这里应该调用 Monkeys 的注册 API
      // const response = await axios.post('http://localhost:3000/api/tools/register', registrationPayload);
      
      console.log('✅ 工具注册完成');
    } catch (error) {
      console.error('❌ 工具注册失败:', error);
      throw error;
    }
  }
}

