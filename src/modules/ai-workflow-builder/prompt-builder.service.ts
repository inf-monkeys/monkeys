import { Injectable } from '@nestjs/common';
import { SimplifiedToolInfo, ToolsCatalogService } from './tools-catalog.service';
import { findMatchingTemplate } from './templates';
import { WORKFLOW_EXAMPLES } from './examples/workflow-examples';

/**
 * 提示词构建服务
 * 负责构建发送给LLM的系统提示词和用户提示词
 */
@Injectable()
export class PromptBuilderService {
  constructor(private readonly toolsCatalogService: ToolsCatalogService) {}

  /**
   * 构建系统提示词
   */
  async buildSystemPrompt(tools: SimplifiedToolInfo[], userDescription?: string): Promise<string> {
    // 使用真实工作流示例进行Few-shot学习
    const fewShotExamples = this.buildFewShotFromRealExamples();

    // 2. 使用增强的工具格式化
    const toolsDescription = tools.map((tool) => this.toolsCatalogService.formatToolForPromptDetailed(tool)).join('\n\n');

    return `你是 Monkeys 平台的工作流生成专家。根据用户的自然语言描述，生成符合规范的工作流 JSON 定义。

## 可用工具清单

以下是当前平台可用的工具（详细信息包括参数结构和使用示例）：

${toolsDescription}

## 工作流 JSON 规范

工作流定义必须符合以下格式：

\`\`\`json
{
  "displayName": {
    "zh-CN": "工作流中文名称",
    "en-US": "Workflow English Name"
  },
  "description": {
    "zh-CN": "工作流的详细中文描述",
    "en-US": "Detailed workflow description in English"
  },
  "iconUrl": "emoji:🎨:#7fa3f8",
  "variables": [
    {
      "name": "变量名称（小写字母和下划线）",
      "displayName": {
        "zh-CN": "变量中文显示名称",
        "en-US": "Variable English Display Name"
      },
      "type": "string | number | boolean | options | json",
      "required": true,
      "default": "默认值（可选）",
      "description": {
        "zh-CN": "变量中文说明",
        "en-US": "Variable description in English"
      },
      "typeOptions": {},
      "options": [
        {
          "name": {"zh-CN": "选项中文名", "en-US": "Option English Name"},
          "value": "选项值"
        }
      ]
    }
  ],
  "tasks": [
    {
      "name": "工具完整名称（namespace:tool_name）",
      "taskReferenceName": "任务引用名_必须唯一",
      "type": "SIMPLE",
      "displayName": {
        "zh-CN": "任务中文显示名称",
        "en-US": "Task English Display Name"
      },
      "inputParameters": {
        "参数名1": "\${workflow.input.变量名}",
        "参数名2": "\${前置任务引用名.output.字段名}"
      }
    }
  ],
  "output": [
    {
      "key": "输出字段名",
      "value": "\${任务引用名.output.字段名}"
    }
  ]
}
\`\`\`

## 特殊任务类型

### 1. SWITCH (条件分支)
当需要根据条件执行不同任务时使用：

\`\`\`json
{
  "name": "switch_task_name",
  "taskReferenceName": "switch_task_ref",
  "type": "SWITCH",
  "displayName": {
    "zh-CN": "条件分支",
    "en-US": "Switch Branch"
  },
  "inputParameters": {
    "evaluatorType": "javascript",
    "expression": "$.workflow.input.variable_name",
    "parameters": {
      "variable_name": "\${workflow.input.variable_name}"
    }
  },
  "decisionCases": {
    "option1": [
      /* 当值为 option1 时执行的任务列表 */
    ],
    "option2": [
      /* 当值为 option2 时执行的任务列表 */
    ]
  },
  "defaultCase": []
}
\`\`\`

### 2. DO_WHILE (循环)
需要重复执行任务时使用：

\`\`\`json
{
  "type": "DO_WHILE",
  "name": "loop_task",
  "taskReferenceName": "loop_task_ref",
  "inputParameters": {
    "loopCondition": "$.loop_counter < 10"
  },
  "loopOver": [
    /* 循环体任务 */
  ]
}
\`\`\`

## 🚨 关键规则（请严格遵守）

### 规则1：工具名称格式 ⚠️ 最重要
- **规则**：工具名称在"可用工具清单"中已经是完整格式（namespace:tool_name），**直接复制使用，不要修改**
- **正确示例**：third_party_api:gemini_3_pro_image_generate（直接从工具清单复制）
- **错误示例1**：third_party_api:third_party_api:gemini_3_pro_image_generate（❌ 错误！重复了namespace）
- **错误示例2**：gemini_3_pro_image_generate（❌ 错误！缺少namespace）
- **验证方法**：
  1. 在"可用工具清单"中找到工具（例如：### third_party_api:gemini_3_pro_image_generate）
  2. 完整复制标题中的工具名称，包括冒号
  3. 不要添加或删除任何前缀

### 规则2：参数嵌套规则（最重要！）
**判断方法**：
1. 查看工具的"输入参数"部分
2. 如果有一个名为 "input" 的参数，且类型为 "json"
3. 则将所有业务参数嵌套在 input 对象内

**示例A - 需要嵌套**（工具定义中有 input 参数）：
\`\`\`json
// 工具定义显示：
输入参数:
  - input (json) [必填]
    内部结构:
      - prompt (string)
      - image_size (string)

// 正确使用（嵌套在 input 内）
"inputParameters": {
  "input": {
    "prompt": "\${workflow.input.prompt}",
    "image_size": "2K"
  }
}
\`\`\`

**示例B - 直接平铺**（工具定义中没有 input 参数）：
\`\`\`json
// 工具定义显示：
输入参数:
  - url (string) [必填]
  - method (string) [必填]

// 正确使用（直接平铺）
"inputParameters": {
  "url": "\${workflow.input.url}",
  "method": "GET"
}
\`\`\`

### 规则3：参考工具的使用示例
- 每个工具在"可用工具清单"中都有完整的使用示例
- **直接参考示例中的参数结构**，不要自己猜测

### 规则4：displayName 使用 i18n 对象
- 所有 displayName 和 description 都必须是包含 "zh-CN" 和 "en-US" 的对象

### 规则5：taskReferenceName 必须唯一
- 每个任务的引用名不能重复

### 规则6：引用变量和任务输出
- 引用工作流输入：\${workflow.input.变量名}
- 引用任务输出：\${任务引用名.output.字段名}

### 规则7：只使用可用工具
- 只能使用"可用工具清单"中列出的工具
- 完整复制工具名称，不要修改

### 规则8：必填参数
- 确保所有标记为必填的参数都有值

### 规则9：参数类型匹配
- 确保参数类型与工具定义匹配

### 规则10：合理的图标
- iconUrl 使用 emoji:表情符号:#颜色代码 格式

## Few-shot 示例

${fewShotExamples}

## 输出要求

- **只返回 JSON**：不要包含任何额外的解释或markdown代码块标记
- **有效的 JSON**：确保输出是可解析的 JSON 格式
- **完整的定义**：包含所有必需的字段

现在，请根据用户的描述生成工作流 JSON。`;
  }

  /**
   * 构建用户提示词
   */
  buildUserPrompt(description: string, customName?: string): string {
    let prompt = `请生成一个工作流：${description}`;

    if (customName) {
      prompt += `\n\n工作流名称设置为：${customName}`;
    }

    return prompt;
  }

  /**
   * 从场景模板构建 Few-shot 示例
   */
  private buildFewShotFromTemplate(template: any): string {
    const displayName = typeof template.displayName === 'string' ? template.displayName : template.displayName['zh-CN'] || template.displayName['en-US'];

    return `
### 场景示例：${displayName}

**用户描述**：
"${template.userPromptExample}"

**生成的工作流**（正确示例）：
\`\`\`json
${JSON.stringify(template.workflowExample, null, 2)}
\`\`\`

**关键点**：
- ✅ 工具名称：${template.requiredTools.join(', ')}
- ✅ 参数结构：嵌套在 input 对象内
- ✅ 所有字段都使用 i18n 对象
`.trim();
  }

  /**
   * 从真实工作流示例构建 Few-shot 示例
   */
  private buildFewShotFromRealExamples(): string {
    const examples = WORKFLOW_EXAMPLES.map((example, index) => {
      const displayName =
        typeof example.workflowJson.displayName === 'string'
          ? example.workflowJson.displayName
          : example.workflowJson.displayName['zh-CN'] || example.workflowJson.displayName['en-US'] || example.scenario;

      return `
### 真实示例${index + 1}：${displayName}

**场景**：${example.scenario}

**用户描述**：
"${example.userDescription}"

**生成的工作流**（正确示例）：
\`\`\`json
${JSON.stringify(example.workflowJson, null, 2)}
\`\`\`

**关键特性**（必须学习）：
${example.keyFeatures.map((feature) => `- ✅ ${feature}`).join('\n')}
`.trim();
    }).join('\n\n---\n\n');

    return examples;
  }

  /**
   * 构建修复提示词
   */
  buildFixPrompt(workflow: any, issues: any[]): string {
    return `这个工作流有验证错误，请修复。

原工作流：
${JSON.stringify(workflow, null, 2)}

验证错误：
${JSON.stringify(issues, null, 2)}

请返回修复后的完整工作流 JSON。只返回 JSON，不要包含任何解释。`;
  }

  /**
   * 获取 Few-shot 示例
   */
  private getFewShotExamples(): string {
    return `### 示例1：文生图工作流

**用户描述**：
"创建一个文生图工作流，使用 Gemini 3 Pro，用户可以输入提示词和选择分辨率"

**生成的工作流**：
\`\`\`json
{
  "displayName": {
    "zh-CN": "AI 文生图工作流",
    "en-US": "AI Text-to-Image Workflow"
  },
  "description": {
    "zh-CN": "使用 Gemini 3 Pro 根据文本提示生成图片",
    "en-US": "Generate images from text prompts using Gemini 3 Pro"
  },
  "iconUrl": "emoji:🎨:#7fa3f8",
  "variables": [
    {
      "name": "prompt",
      "displayName": {
        "zh-CN": "图片描述",
        "en-US": "Image Description"
      },
      "type": "string",
      "required": true,
      "typeOptions": {},
      "description": {
        "zh-CN": "描述你想生成的图片内容",
        "en-US": "Describe the image you want to generate"
      }
    },
    {
      "name": "resolution",
      "displayName": {
        "zh-CN": "图像分辨率",
        "en-US": "Image Resolution"
      },
      "type": "options",
      "required": false,
      "default": "2K",
      "typeOptions": {},
      "options": [
        {
          "name": {"zh-CN": "1K 标清", "en-US": "1K SD"},
          "value": "1K"
        },
        {
          "name": {"zh-CN": "2K 高清", "en-US": "2K HD"},
          "value": "2K"
        },
        {
          "name": {"zh-CN": "4K 超清", "en-US": "4K UHD"},
          "value": "4K"
        }
      ]
    }
  ],
  "tasks": [
    {
      "name": "gemini_ai:generate_image",
      "taskReferenceName": "generate_image_ref",
      "type": "SIMPLE",
      "displayName": {
        "zh-CN": "生成图片",
        "en-US": "Generate Image"
      },
      "inputParameters": {
        "prompt": "\${workflow.input.prompt}",
        "image_size": "\${workflow.input.resolution}"
      }
    }
  ],
  "output": [
    {
      "key": "images",
      "value": "\${generate_image_ref.output.images}"
    }
  ]
}
\`\`\`

### 示例2：多模型文生图工作流（含 SWITCH）

**用户描述**：
"创建文生图工作流，支持 Gemini、GPT、即梦三个模型，用户选择模型和输入提示词"

**生成的工作流**：
\`\`\`json
{
  "displayName": {
    "zh-CN": "多模型文生图工作流",
    "en-US": "Multi-Model Text-to-Image Workflow"
  },
  "description": {
    "zh-CN": "支持多个 AI 模型的文生图工作流",
    "en-US": "Text-to-image workflow supporting multiple AI models"
  },
  "iconUrl": "emoji:🎨:#7fa3f8",
  "variables": [
    {
      "name": "prompt",
      "displayName": {
        "zh-CN": "提示词",
        "en-US": "Prompt"
      },
      "type": "string",
      "required": true,
      "typeOptions": {}
    },
    {
      "name": "model",
      "displayName": {
        "zh-CN": "AI 模型",
        "en-US": "AI Model"
      },
      "type": "options",
      "required": true,
      "default": "gemini",
      "typeOptions": {},
      "options": [
        {
          "name": {"zh-CN": "Gemini 3 Pro", "en-US": "Gemini 3 Pro"},
          "value": "gemini"
        },
        {
          "name": {"zh-CN": "GPT Image 1", "en-US": "GPT Image 1"},
          "value": "gpt"
        },
        {
          "name": {"zh-CN": "即梦 AI", "en-US": "JiMeng AI"},
          "value": "jimeng"
        }
      ]
    }
  ],
  "tasks": [
    {
      "name": "switch_model",
      "taskReferenceName": "model_selector_ref",
      "type": "SWITCH",
      "displayName": {
        "zh-CN": "模型选择",
        "en-US": "Model Selection"
      },
      "inputParameters": {
        "evaluatorType": "javascript",
        "expression": "$.workflow.input.model",
        "parameters": {
          "model": "\${workflow.input.model}"
        }
      },
      "decisionCases": {
        "gemini": [
          {
            "name": "gemini_ai:generate_image",
            "taskReferenceName": "gemini_generate_ref",
            "type": "SIMPLE",
            "displayName": {
              "zh-CN": "Gemini 生图",
              "en-US": "Gemini Generate"
            },
            "inputParameters": {
              "prompt": "\${workflow.input.prompt}"
            }
          }
        ],
        "gpt": [
          {
            "name": "openai:generate_image",
            "taskReferenceName": "gpt_generate_ref",
            "type": "SIMPLE",
            "displayName": {
              "zh-CN": "GPT 生图",
              "en-US": "GPT Generate"
            },
            "inputParameters": {
              "prompt": "\${workflow.input.prompt}",
              "model": "gpt-image-1"
            }
          }
        ],
        "jimeng": [
          {
            "name": "jimeng_ark:generate",
            "taskReferenceName": "jimeng_generate_ref",
            "type": "SIMPLE",
            "displayName": {
              "zh-CN": "即梦生图",
              "en-US": "JiMeng Generate"
            },
            "inputParameters": {
              "prompt": "\${workflow.input.prompt}"
            }
          }
        ]
      }
    }
  ],
  "output": [
    {
      "key": "result",
      "value": "\${model_selector_ref.output}"
    }
  ]
}
\`\`\`

### 示例3：图片处理工作流

**用户描述**：
"创建图片批处理流程，下载图片、压缩、加水印、上传到 OSS"

**生成的工作流**：
\`\`\`json
{
  "displayName": {
    "zh-CN": "图片批处理工作流",
    "en-US": "Image Batch Processing Workflow"
  },
  "description": {
    "zh-CN": "下载、压缩、加水印并上传图片",
    "en-US": "Download, compress, watermark and upload images"
  },
  "iconUrl": "emoji:📷:#42a5f5",
  "variables": [
    {
      "name": "image_url",
      "displayName": {
        "zh-CN": "图片URL",
        "en-US": "Image URL"
      },
      "type": "string",
      "required": true,
      "typeOptions": {}
    },
    {
      "name": "watermark_text",
      "displayName": {
        "zh-CN": "水印文字",
        "en-US": "Watermark Text"
      },
      "type": "string",
      "required": false,
      "typeOptions": {}
    }
  ],
  "tasks": [
    {
      "name": "http:download",
      "taskReferenceName": "download_image_ref",
      "type": "SIMPLE",
      "displayName": {
        "zh-CN": "下载图片",
        "en-US": "Download Image"
      },
      "inputParameters": {
        "url": "\${workflow.input.image_url}"
      }
    },
    {
      "name": "image:compress",
      "taskReferenceName": "compress_image_ref",
      "type": "SIMPLE",
      "displayName": {
        "zh-CN": "压缩图片",
        "en-US": "Compress Image"
      },
      "inputParameters": {
        "image": "\${download_image_ref.output.file}"
      }
    },
    {
      "name": "image:watermark",
      "taskReferenceName": "add_watermark_ref",
      "type": "SIMPLE",
      "displayName": {
        "zh-CN": "添加水印",
        "en-US": "Add Watermark"
      },
      "inputParameters": {
        "image": "\${compress_image_ref.output.file}",
        "text": "\${workflow.input.watermark_text}"
      }
    },
    {
      "name": "oss:upload",
      "taskReferenceName": "upload_to_oss_ref",
      "type": "SIMPLE",
      "displayName": {
        "zh-CN": "上传到OSS",
        "en-US": "Upload to OSS"
      },
      "inputParameters": {
        "file": "\${add_watermark_ref.output.file}"
      }
    }
  ],
  "output": [
    {
      "key": "oss_url",
      "value": "\${upload_to_oss_ref.output.url}"
    }
  ]
}
\`\`\``;
  }
}
