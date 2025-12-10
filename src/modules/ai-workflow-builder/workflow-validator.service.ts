import { Injectable, Logger } from '@nestjs/common';
import { SimplifiedToolInfo } from './tools-catalog.service';

export interface ValidationResult {
  isValid: boolean;
  fixed: any;
  warnings: string[];
  errors: string[];
}

/**
 * 工作流验证器服务
 * 验证并自动修正AI生成的工作流JSON
 */
@Injectable()
export class WorkflowValidatorService {
  private readonly logger = new Logger(WorkflowValidatorService.name);

  /**
   * 验证并修正工作流JSON
   */
  validateAndFix(workflowJson: any, availableTools: SimplifiedToolInfo[]): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    let fixed = JSON.parse(JSON.stringify(workflowJson)); // 深拷贝

    try {
      // 1. 验证基本结构
      this.validateBasicStructure(fixed, warnings, errors);

      // 2. 验证和修正Tasks
      if (fixed.tasks && Array.isArray(fixed.tasks)) {
        fixed.tasks = this.validateTasks(fixed.tasks, availableTools, warnings, errors);
      }

      // 3. 验证Variables
      if (fixed.variables && Array.isArray(fixed.variables)) {
        this.validateVariables(fixed.variables, warnings);
      }

      // 4. 验证变量引用完整性
      this.validateVariableReferences(fixed, warnings);

      this.logger.log(`验证完成: ${warnings.length}个警告, ${errors.length}个错误`);
    } catch (error) {
      errors.push(`验证过程出错: ${error.message}`);
      this.logger.error('验证失败:', error);
    }

    return {
      isValid: errors.length === 0,
      fixed,
      warnings,
      errors,
    };
  }

  /**
   * 验证基本结构
   */
  private validateBasicStructure(workflow: any, warnings: string[], errors: string[]): void {
    if (!workflow.displayName) {
      warnings.push('缺少displayName，已添加默认值');
      workflow.displayName = { 'zh-CN': '未命名工作流', 'en-US': 'Unnamed Workflow' };
    }

    if (!workflow.tasks || !Array.isArray(workflow.tasks)) {
      errors.push('缺少tasks数组');
      workflow.tasks = [];
    }

    if (!workflow.variables || !Array.isArray(workflow.variables)) {
      warnings.push('缺少variables数组，已添加空数组');
      workflow.variables = [];
    }

    if (!workflow.iconUrl) {
      workflow.iconUrl = 'emoji:⚙️:#4285F4';
    }
  }

  /**
   * 验证并修正Tasks
   */
  private validateTasks(tasks: any[], availableTools: SimplifiedToolInfo[], warnings: string[], errors: string[]): any[] {
    return tasks.map((task, index) => {
      const fixedTask = { ...task };

      // 处理SWITCH节点
      if (task.type === 'SWITCH') {
        this.validateSwitchTask(fixedTask, availableTools, warnings, errors);
      }

      // 处理SIMPLE节点
      if (task.type === 'SIMPLE') {
        this.validateSimpleTask(fixedTask, availableTools, warnings, errors);
      }

      // 验证taskReferenceName
      if (!fixedTask.taskReferenceName) {
        const generatedName = `${fixedTask.name || 'task'}_${this.generateRandomId()}`;
        warnings.push(`Task ${index} 缺少taskReferenceName，已生成: ${generatedName}`);
        fixedTask.taskReferenceName = generatedName;
      }

      return fixedTask;
    });
  }

  /**
   * 验证SWITCH节点
   */
  private validateSwitchTask(task: any, availableTools: SimplifiedToolInfo[], warnings: string[], errors: string[]): void {
    if (!task.evaluatorType) {
      warnings.push(`SWITCH任务 ${task.taskReferenceName} 缺少evaluatorType，已设置为value-param`);
      task.evaluatorType = 'value-param';
    }

    if (!task.expression) {
      errors.push(`SWITCH任务 ${task.taskReferenceName} 缺少expression`);
    }

    if (!task.decisionCases || typeof task.decisionCases !== 'object') {
      errors.push(`SWITCH任务 ${task.taskReferenceName} 缺少decisionCases`);
      return;
    }

    // 验证每个case中的tasks
    for (const [caseName, caseTasks] of Object.entries(task.decisionCases)) {
      if (Array.isArray(caseTasks)) {
        task.decisionCases[caseName] = this.validateTasks(caseTasks as any[], availableTools, warnings, errors);
      }
    }
  }

  /**
   * 验证SIMPLE节点
   */
  private validateSimpleTask(task: any, availableTools: SimplifiedToolInfo[], warnings: string[], errors: string[]): void {
    // 1. 验证工具名称存在
    if (!task.name) {
      errors.push(`Task ${task.taskReferenceName} 缺少name`);
      return;
    }

    // 2. 检查工具是否存在
    const toolExists = availableTools.some((t) => this.getToolFullName(t) === task.name);

    if (!toolExists) {
      // 尝试模糊匹配
      const similarTool = this.findSimilarTool(task.name, availableTools);
      if (similarTool) {
        const correctName = this.getToolFullName(similarTool);
        warnings.push(`工具 "${task.name}" 不存在，已自动修正为: "${correctName}"`);
        task.name = correctName;
      } else {
        errors.push(`工具 "${task.name}" 不存在且无法找到相似工具`);
      }
    }

    // 3. 验证inputParameters结构
    if (task.inputParameters) {
      // 检查是否正确嵌套在input对象内
      if (!task.inputParameters.input && this.needsInputNesting(task.name)) {
        // 自动修正：将所有参数包裹在input对象中
        const originalParams = { ...task.inputParameters };
        const preservedKeys = ['__advancedConfig', 'credential', 'baseUrl', 'endpoint', 'type', 'language', 'sourceCode', 'parameters'];

        const preserved: any = {};
        const toNest: any = {};

        for (const [key, value] of Object.entries(originalParams)) {
          if (preservedKeys.includes(key)) {
            preserved[key] = value;
          } else {
            toNest[key] = value;
          }
        }

        if (Object.keys(toNest).length > 0) {
          warnings.push(`Task ${task.taskReferenceName} 参数未正确嵌套，已自动修正`);
          task.inputParameters = {
            ...preserved,
            input: toNest,
          };
        }
      }
    }
  }

  /**
   * 判断工具是否需要input嵌套
   */
  private needsInputNesting(toolName: string): boolean {
    // 大部分third_party_api工具需要input嵌套
    // sandbox工具参数通过parameters传递，不需要input嵌套
    if (toolName.startsWith('sandbox:')) {
      return false;
    }
    return toolName.startsWith('third_party_api:');
  }

  /**
   * 验证Variables
   */
  private validateVariables(variables: any[], warnings: string[]): void {
    const variableNames = new Set<string>();

    variables.forEach((variable, index) => {
      if (!variable.name) {
        warnings.push(`Variable ${index} 缺少name`);
      }

      if (variableNames.has(variable.name)) {
        warnings.push(`变量名 "${variable.name}" 重复`);
      }
      variableNames.add(variable.name);

      if (!variable.displayName) {
        warnings.push(`变量 "${variable.name}" 缺少displayName`);
      }

      if (!variable.type) {
        warnings.push(`变量 "${variable.name}" 缺少type，已设置为string`);
        variable.type = 'string';
      }

      // 确保typeOptions存在
      if (!variable.typeOptions) {
        variable.typeOptions = {};
      }
    });
  }

  /**
   * 验证变量引用完整性
   */
  private validateVariableReferences(workflow: any, warnings: string[]): void {
    const definedVariables = new Set<string>();

    if (workflow.variables) {
      workflow.variables.forEach((v: any) => {
        if (v.name) {
          definedVariables.add(v.name);
        }
      });
    }

    // 提取tasks中使用的变量引用
    const usedVariables = this.extractVariableReferences(workflow.tasks);

    usedVariables.forEach((varName) => {
      if (!definedVariables.has(varName)) {
        warnings.push(`Task中引用了未定义的变量: ${varName}`);
      }
    });
  }

  /**
   * 从tasks中提取变量引用
   */
  private extractVariableReferences(tasks: any[]): Set<string> {
    const references = new Set<string>();
    const regex = /\$\{workflow\.input\.(\w+)\}/g;

    const scanObject = (obj: any) => {
      if (typeof obj === 'string') {
        let match;
        while ((match = regex.exec(obj)) !== null) {
          references.add(match[1]);
        }
      } else if (Array.isArray(obj)) {
        obj.forEach(scanObject);
      } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(scanObject);
      }
    };

    scanObject(tasks);
    return references;
  }

  /**
   * 模糊匹配工具名（防止拼写错误）
   */
  private findSimilarTool(inputName: string, tools: SimplifiedToolInfo[]): SimplifiedToolInfo | null {
    const lowerInput = inputName.toLowerCase();

    // 1. 精确匹配（忽略大小写）
    for (const tool of tools) {
      if (this.getToolFullName(tool).toLowerCase() === lowerInput) {
        return tool;
      }
    }

    // 2. 部分匹配（包含关系）
    for (const tool of tools) {
      const fullName = this.getToolFullName(tool).toLowerCase();
      if (fullName.includes(lowerInput) || lowerInput.includes(fullName)) {
        return tool;
      }
    }

    // 3. 编辑距离匹配（Levenshtein距离）
    let minDistance = Infinity;
    let bestMatch: SimplifiedToolInfo | null = null;

    for (const tool of tools) {
      const fullName = this.getToolFullName(tool);
      const distance = this.levenshteinDistance(lowerInput, fullName.toLowerCase());

      if (distance < minDistance && distance <= 5) {
        // 最大允许5个字符差异
        minDistance = distance;
        bestMatch = tool;
      }
    }

    return bestMatch;
  }

  /**
   * 计算Levenshtein距离
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1, // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * 获取工具完整名称
   */
  private getToolFullName(tool: SimplifiedToolInfo): string {
    // 如果 name 已经包含了 namespace 前缀，直接返回
    if (tool.name.includes(':')) {
      return tool.name;
    }
    // 否则拼接 namespace
    return tool.namespace ? `${tool.namespace}:${tool.name}` : tool.name;
  }

  /**
   * 生成随机ID
   */
  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 10);
  }
}
