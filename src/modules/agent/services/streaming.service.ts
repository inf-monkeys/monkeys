import { UIMessagePart } from '@/database/entities/agents/message.entity';
import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { streamText } from 'ai';
import { AgentToolExecutorService } from './agent-tool-executor.service';
import { AgentToolRegistryService } from './agent-tool-registry.service';
import { AgentService } from './agent.service';
import { Message, MessageService } from './message.service';
import { ModelRegistryService } from './model-registry.service';
import { ThreadService } from './thread.service';
import { CanvasContextService } from './canvas-context.service';
import { DesignMetadataService } from '@/modules/design/design.metadata.service';

export interface StreamOptions {
  threadId: string;
  teamId: string;
  userId: string;
  agentId?: string;
  modelId?: string;
  userMessage: string;
  imageMediaIds?: string[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  // Canvas context for tldraw-assistant
  canvasData?: any;
  selectedShapeIds?: string[];
  viewport?: { x: number; y: number; zoom: number };
  // Design board context
  designBoardId?: string;
}

export interface SSEEvent {
  type: string;
  [key: string]: any;
}

/**
 * Mock画板数据 - 用于工作流生成功能
 */
const MOCK_WORKFLOW_CANVAS_STATE = {
  "session": {
    "version": 0,
    "isGridMode": false,
    "pageStates": [
      {
        "camera": { "x": -493.058819760992, "y": 10.568586638448108, "z": 1 },
        "pageId": "page:page",
        "focusedGroupId": null,
        "selectedShapeIds": []
      }
    ],
    "isDebugMode": false,
    "isFocusMode": false,
    "isToolLocked": false,
    "currentPageId": "page:page",
    "exportBackground": true
  },
  "document": {
    "store": {
      "page:page": {
        "id": "page:page",
        "meta": {},
        "name": "页面 1",
        "index": "a1",
        "typeName": "page"
      },
      "document:document": {
        "id": "document:document",
        "meta": {},
        "name": "",
        "gridSize": 10,
        "typeName": "document"
      },
      "shape:2ATmQeMg_MPTwa6z0Y9RD": {
        "x": 705.0390625,
        "y": 267.9765625,
        "id": "shape:2ATmQeMg_MPTwa6z0Y9RD",
        "meta": {},
        "type": "instruction",
        "index": "a1fFVL5V",
        "props": {
          "h": 200,
          "w": 300,
          "color": "blue",
          "content": "",
          "imageUrl": "",
          "inputMode": "text",
          "isRunning": false,
          "connections": []
        },
        "opacity": 1,
        "isLocked": false,
        "parentId": "page:page",
        "rotation": 0,
        "typeName": "shape"
      },
      "shape:OaErKiymf4qEQMvJVTiL7": {
        "x": 1449.7284553854652,
        "y": 280.6287189614735,
        "id": "shape:OaErKiymf4qEQMvJVTiL7",
        "meta": {},
        "type": "connection",
        "index": "a0u1WFBC",
        "props": {
          "end": { "x": 233.61328125, "y": 115.62890625 },
          "label": null,
          "start": { "x": 0, "y": 0 }
        },
        "opacity": 1,
        "isLocked": false,
        "parentId": "page:page",
        "rotation": 0,
        "typeName": "shape"
      },
      "shape:Uky9ctvuS9eTiVP3ZFaxB": {
        "x": 1137.48046875,
        "y": 33.78125,
        "id": "shape:Uky9ctvuS9eTiVP3ZFaxB",
        "meta": {},
        "type": "workflow",
        "index": "a2dl7oAV",
        "props": {
          "h": 492,
          "w": 300,
          "color": "violet",
          "isRunning": false,
          "workflowId": "68b54d6b0e508d7bb541698e",
          "connections": [],
          "inputParams": [
            {
              "name": "b7jbtd",
              "type": "file",
              "value": "",
              "required": false,
              "description": "",
              "displayName": "图片上传",
              "typeOptions": { "assetType": "", "multipleValues": false }
            },
            {
              "name": "8nntq7",
              "type": "string",
              "value": "",
              "required": false,
              "description": "",
              "displayName": "提示词",
              "typeOptions": {
                "tips": "",
                "foldUp": false,
                "assetType": "",
                "selectList": [],
                "enableReset": false,
                "enableVoice": false,
                "placeholder": "",
                "enableExpand": false,
                "singleColumn": false,
                "multipleValues": false,
                "voiceButtonText": "",
                "expandButtonText": "",
                "textareaMiniHeight": 180,
                "selectListDisplayMode": "dropdown",
                "knowledgeGraphButtonText": ""
              }
            },
            {
              "name": "pmz87z",
              "type": "number",
              "value": 1,
              "required": false,
              "description": "",
              "displayName": "生成数量",
              "typeOptions": {
                "maxValue": 4,
                "minValue": 1,
                "assetType": "",
                "multipleValues": false,
                "numberPrecision": 1
              }
            }
          ],
          "workflowName": "视觉概念探索 (图像生成)",
          "generatedTime": 0,
          "inputConnections": [
            { "paramName": "b7jbtd", "instructionId": "shape:cWZH6cbG_4VdZyjXWnzNH" },
            { "paramName": "8nntq7", "instructionId": "shape:2ATmQeMg_MPTwa6z0Y9RD" }
          ],
          "workflowDescription": ""
        },
        "opacity": 1,
        "isLocked": false,
        "parentId": "page:page",
        "rotation": 0,
        "typeName": "shape"
      },
      "shape:cWZH6cbG_4VdZyjXWnzNH": {
        "x": 665.4687788734783,
        "y": -21.07330807946417,
        "id": "shape:cWZH6cbG_4VdZyjXWnzNH",
        "meta": {},
        "type": "instruction",
        "index": "a34JtTlV",
        "props": {
          "h": 200,
          "w": 407.4101562499999,
          "color": "blue",
          "content": "",
          "imageUrl": "",
          "inputMode": "image",
          "isRunning": false,
          "connections": []
        },
        "opacity": 1,
        "isLocked": false,
        "parentId": "page:page",
        "rotation": 0,
        "typeName": "shape"
      },
      "shape:oCYkNI7P7cSsFc6S9q_4c": {
        "x": 1692.2636116354652,
        "y": 290.8982502114735,
        "id": "shape:oCYkNI7P7cSsFc6S9q_4c",
        "meta": {},
        "type": "output",
        "index": "a4UqCQCl",
        "props": {
          "h": 200,
          "w": 300,
          "color": "green",
          "images": [],
          "content": "",
          "imageUrl": "",
          "sourceId": "",
          "generatedTime": 0
        },
        "opacity": 1,
        "isLocked": false,
        "parentId": "page:page",
        "rotation": 0,
        "typeName": "shape"
      },
      "shape:qurSwVE7oyA358-JHxhu2": {
        "x": 1083.2461226234782,
        "y": 82.57512942053583,
        "id": "shape:qurSwVE7oyA358-JHxhu2",
        "meta": {},
        "type": "connection",
        "index": "a0mMZBoO",
        "props": {
          "end": { "x": 44.33203125, "y": 80.25390625 },
          "label": null,
          "start": { "x": 0, "y": 0 }
        },
        "opacity": 1,
        "isLocked": false,
        "parentId": "page:page",
        "rotation": 0,
        "typeName": "shape"
      },
      "shape:sRgwy_Y6hxX2DWBuDEf9k": {
        "x": 1007.99609375,
        "y": 370.16015625,
        "id": "shape:sRgwy_Y6hxX2DWBuDEf9k",
        "meta": {},
        "type": "connection",
        "index": "a0Sp4n4V",
        "props": {
          "end": { "x": 101.171875, "y": 29.8046875 },
          "label": null,
          "start": { "x": 0, "y": 0 }
        },
        "opacity": 1,
        "isLocked": false,
        "parentId": "page:page",
        "rotation": 0,
        "typeName": "shape"
      },
      "binding:8RZrwjSi4dB9D7O1n0jvk": {
        "id": "binding:8RZrwjSi4dB9D7O1n0jvk",
        "meta": {},
        "toId": "shape:Uky9ctvuS9eTiVP3ZFaxB",
        "type": "connection",
        "props": { "portId": "param_b7jbtd", "terminal": "end" },
        "fromId": "shape:qurSwVE7oyA358-JHxhu2",
        "typeName": "binding"
      },
      "binding:DLeVyK3pmu58hmmpZeHcr": {
        "id": "binding:DLeVyK3pmu58hmmpZeHcr",
        "meta": {},
        "toId": "shape:oCYkNI7P7cSsFc6S9q_4c",
        "type": "connection",
        "props": { "portId": "input", "terminal": "end" },
        "fromId": "shape:OaErKiymf4qEQMvJVTiL7",
        "typeName": "binding"
      },
      "binding:YZMtxeyaC5hp9A--8km9C": {
        "id": "binding:YZMtxeyaC5hp9A--8km9C",
        "meta": {},
        "toId": "shape:cWZH6cbG_4VdZyjXWnzNH",
        "type": "connection",
        "props": { "portId": "output", "terminal": "start" },
        "fromId": "shape:qurSwVE7oyA358-JHxhu2",
        "typeName": "binding"
      },
      "binding:i6kRBSPNTFvgEi7DsyK1X": {
        "id": "binding:i6kRBSPNTFvgEi7DsyK1X",
        "meta": {},
        "toId": "shape:2ATmQeMg_MPTwa6z0Y9RD",
        "type": "connection",
        "props": { "portId": "output", "terminal": "start" },
        "fromId": "shape:sRgwy_Y6hxX2DWBuDEf9k",
        "typeName": "binding"
      },
      "binding:yWjTc7Rl8niGKegjalAWs": {
        "id": "binding:yWjTc7Rl8niGKegjalAWs",
        "meta": {},
        "toId": "shape:Uky9ctvuS9eTiVP3ZFaxB",
        "type": "connection",
        "props": { "portId": "output", "terminal": "start" },
        "fromId": "shape:OaErKiymf4qEQMvJVTiL7",
        "typeName": "binding"
      },
      "binding:yxeQwoKyGu_NWzJDNrZ7A": {
        "id": "binding:yxeQwoKyGu_NWzJDNrZ7A",
        "meta": {},
        "toId": "shape:Uky9ctvuS9eTiVP3ZFaxB",
        "type": "connection",
        "props": { "portId": "param_8nntq7", "terminal": "end" },
        "fromId": "shape:sRgwy_Y6hxX2DWBuDEf9k",
        "typeName": "binding"
      }
    },
    "schema": {
      "sequences": {
        "com.tldraw.page": 1,
        "com.tldraw.asset": 1,
        "com.tldraw.shape": 4,
        "com.tldraw.store": 5,
        "com.tldraw.camera": 1,
        "com.tldraw.pointer": 1,
        "com.tldraw.document": 2,
        "com.tldraw.instance": 25,
        "com.tldraw.shape.geo": 10,
        "com.tldraw.shape.draw": 2,
        "com.tldraw.shape.line": 5,
        "com.tldraw.shape.node": 0,
        "com.tldraw.shape.note": 9,
        "com.tldraw.shape.text": 3,
        "com.tldraw.asset.image": 5,
        "com.tldraw.asset.video": 5,
        "com.tldraw.shape.arrow": 7,
        "com.tldraw.shape.embed": 4,
        "com.tldraw.shape.frame": 1,
        "com.tldraw.shape.group": 0,
        "com.tldraw.shape.image": 5,
        "com.tldraw.shape.video": 4,
        "com.tldraw.shape.output": 0,
        "com.tldraw.binding.arrow": 1,
        "com.tldraw.asset.bookmark": 2,
        "com.tldraw.shape.bookmark": 2,
        "com.tldraw.shape.workflow": 0,
        "com.tldraw.shape.highlight": 1,
        "com.tldraw.shape.connection": 0,
        "com.tldraw.shape.live-image": 0,
        "com.tldraw.instance_presence": 6,
        "com.tldraw.shape.instruction": 0,
        "com.tldraw.binding.connection": 0,
        "com.tldraw.instance_page_state": 5
      },
      "schemaVersion": 2
    }
  }
};

/**
 * 流式处理服务
 *
 * **职责**：
 * - 使用 AI SDK v6 进行流式对话
 * - 处理工具调用
 * - 保存消息到数据库
 * - 返回 SSE 格式的事件流
 */
@Injectable()
export class StreamingService {
  private readonly logger = new Logger(StreamingService.name);

  constructor(
    private readonly modelRegistry: ModelRegistryService,
    private readonly messageService: MessageService,
    private readonly threadService: ThreadService,
    private readonly agentService: AgentService,
    private readonly canvasContextService: CanvasContextService,
    @Inject(forwardRef(() => AgentToolRegistryService))
    private readonly agentToolRegistry: AgentToolRegistryService,
    @Inject(forwardRef(() => AgentToolExecutorService))
    private readonly agentToolExecutor: AgentToolExecutorService,
    @Inject(forwardRef(() => DesignMetadataService))
    private readonly designMetadataService: DesignMetadataService,
  ) {}

  /**
   * 检测用户消息是否包含生成工作流的意图
   */
  private detectWorkflowGenerationIntent(userMessage: string): boolean {
    const patterns = [
      /生成.*工作流/i,
      /创建.*工作流/i,
      /制作.*工作流/i,
      /帮我.*工作流/i,
      /generate.*workflow/i,
      /create.*workflow/i,
      /make.*workflow/i,
    ];

    const matched = patterns.some(pattern => pattern.test(userMessage));
    this.logger.log(`🔍 Workflow intent detection: "${userMessage}" -> ${matched}`);
    return matched;
  }

  /**
   * 创建工作流生成的mock响应
   * 直接更新数据库中的画板snapshot，不经过AI模型
   * 等待3秒后返回响应
   */
  private async createWorkflowGenerationMockResponse(opts: StreamOptions): Promise<any> {
    const { threadId, teamId, designBoardId } = opts;

    this.logger.log(`🎨 Detected workflow generation intent, designBoardId: ${designBoardId}`);
    this.logger.log(`⏳ Waiting 3 seconds before responding...`);

    // 等待3秒
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 如果有designBoardId，直接更新数据库中的画板数据
    if (designBoardId) {
      try {
        await this.designMetadataService.update(designBoardId, {
          snapshot: MOCK_WORKFLOW_CANVAS_STATE,
        });
        this.logger.log(`✅ Updated design board ${designBoardId} with mock workflow canvas`);
      } catch (error) {
        this.logger.error(`❌ Failed to update design board ${designBoardId}:`, error);
      }
    } else {
      this.logger.warn(`⚠️ No designBoardId provided, skipping canvas update`);
    }

    // 创建一个mock的streamText响应
    const mockTextContent = '好的，我已经为您生成了一个图像生成工作流。这个工作流包含了图片上传、提示词输入和生成数量配置。画板已更新！';

    const textPart: UIMessagePart = {
      type: 'text',
      text: mockTextContent,
    };

    const parts: UIMessagePart[] = [textPart];

    // 创建一个模拟的AI SDK流响应
    const mockStream = {
      text: Promise.resolve(mockTextContent),
      usage: Promise.resolve({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      }),
      finishReason: Promise.resolve('stop' as const),
      fullStream: (async function* () {
        // 发送文本
        yield { type: 'text-delta', textDelta: mockTextContent };
        // 发送画板刷新事件
        yield {
          type: 'canvas-refresh',
          designBoardId,
          reason: 'workflow-generated',
          timestamp: Date.now()
        };
      })(),
      toTextStreamResponse: () => {
        // 创建一个文本流响应
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            // 发送文本内容
            controller.enqueue(encoder.encode(`0:${JSON.stringify(mockTextContent)}\n`));
            controller.close();
          },
        });

        return {
          body: stream,
          headers: new Headers({
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
          }),
          status: 200,
        };
      },
    };

    // 在后台保存消息并设置thread状态
    (async () => {
      try {
        await this.messageService.saveAssistantMessage({
          threadId,
          teamId,
          parts,
          metadata: {
            model: 'mock-workflow-generator',
            finishReason: 'stop',
            // 添加刷新标志，告诉前端需要刷新画板
            requiresCanvasRefresh: true,
            designBoardId,
          },
        });
        this.logger.debug(`✅ Saved mock workflow generation message for thread ${threadId}`);

        // 设置thread为非运行状态
        await this.threadService.setRunning(threadId, false, teamId);
      } catch (error) {
        this.logger.error(`❌ Failed to save mock message:`, error);
        // 即使失败也要设置thread状态
        await this.threadService.setRunning(threadId, false, teamId);
      }
    })();

    return mockStream;
  }

  /**
   * 主流式处理方法 - 返回 AI SDK 标准格式
   * 供 assistant-ui 直接使用
   */
  async streamForAssistantUI(opts: StreamOptions): Promise<any> {
    const { threadId, teamId, userId, userMessage, imageMediaIds, agentId, canvasData, selectedShapeIds, viewport } = opts;

    try {
      // 1. 设置 Thread 为运行状态
      await this.threadService.setRunning(threadId, true, teamId);

      // 2. 保存用户消息
      const userMsg = await this.messageService.saveUserMessage({
        threadId,
        teamId,
        text: userMessage,
        mediaIds: imageMediaIds,
      });

      // 2.5 检测工作流生成意图 - 如果检测到则直接返回mock响应
      if (agentId === 'tldraw-assistant' && this.detectWorkflowGenerationIntent(userMessage)) {
        this.logger.log(`🎨 Workflow generation intent detected for thread ${threadId}`);
        return await this.createWorkflowGenerationMockResponse(opts);
      }

      // 3. 获取或创建 Agent 配置
      let agent = null;
      if (agentId) {
        try {
          // 尝试获取或自动创建默认 agent
          this.logger.debug(`Attempting to get or create agent: ${agentId}`);
          agent = await this.agentService.getOrCreateDefaultAgent(agentId, teamId, userId);
          this.logger.debug(`Agent resolved: ${agent.id}, name: ${agent.name}`);
        } catch (error) {
          this.logger.error(`Failed to get or create default agent ${agentId}:`, error);
          // 如果不是默认 agent 且不存在，尝试直接获取
          if (error instanceof NotFoundException) {
            try {
              agent = await this.agentService.get(agentId, teamId);
              this.logger.debug(`Agent found by direct lookup: ${agent.id}`);
            } catch {
              this.logger.warn(`Agent ${agentId} not found, using default configuration`);
              // 继续执行，使用默认配置
            }
          } else {
            // 其他错误，抛出
            throw error;
          }
        }
      }

      // 4. 确定模型
      const modelId = opts.modelId || agent?.config.model || 'openai:gpt-4';
      const model = this.modelRegistry.resolveModel(modelId);

      // 5. 获取历史消息（不包含当前用户消息），并在构建请求时显式追加本次用户输入
      const history = await this.messageService.getThreadHistory(threadId, teamId);

      // 5.5 为tldraw-assistant准备canvas context
      let canvasContextMessage = '';
      if (agentId === 'tldraw-assistant') {
        try {
          // 使用前端传入的canvas数据
          canvasContextMessage = await this.canvasContextService.buildCanvasContext({
            threadId,
            teamId,
            userId,
            canvasData,
            selectedShapeIds,
            viewport,
          });
          this.logger.debug(`Canvas context prepared: ${canvasContextMessage.substring(0, 100)}...`);
        } catch (error) {
          this.logger.warn(`Failed to build canvas context: ${error.message}`);
        }
      }

      // 6. 构建系统提示词
      const systemPrompt = this.buildSystemPrompt(opts.systemPrompt || agent?.config.instructions);

      // 7. 准备参数
      const temperature = opts.temperature ?? agent?.config.temperature ?? 0.7;
      const maxSteps = agent?.config.stopWhen?.maxSteps || 20;

      // 将系统提示词 + 历史 + 本次用户消息一起传入模型，确保当前轮能及时响应
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        // 如果有canvas context，添加为assistant消息提供上下文
        ...(canvasContextMessage
          ? [
              {
                role: 'user' as const,
                content: `[Canvas Information]\n${canvasContextMessage}`,
              },
            ]
          : []),
        { role: 'user', content: userMessage },
      ] as Message[];

      // 8. 获取工具（如果启用）
      //
      // 重要说明：
      // - 只有 server-side tools 提供给模型决策调用
      // - Client-side tools（如 tldraw）由前端自动处理，不需要模型干预
      // - Server-side tools: 提供完整的 execute 函数，由后端处理
      //
      // 这样保证：模型专注于逻辑，前端专注于UI交互
      let tools: Record<string, any> | undefined;
      if (agent?.config.tools?.enabled) {
        try {
          const toolNames = agent.config.tools.toolNames || [];
          const built: Record<string, any> = {};

          for (const toolName of toolNames) {
            try {
              const resolvedTool = await this.agentToolRegistry.getToolByName(toolName, teamId);
              const isClientSide = resolvedTool?.metadata?.clientSide === true;

              // 跳过客户端工具 - 前端会自动处理
              if (isClientSide) {
                this.logger.debug(`Skipping client-side tool: ${toolName} (handled by frontend)`);
                continue;
              }

              // Server-side 工具：提供给模型
              const parameters = resolvedTool.parameters || { type: 'object', properties: {} };
              // 确保 properties 和 required 字段存在
              if (!parameters.properties) parameters.properties = {};
              if (!parameters.required) parameters.required = [];

              this.logger.debug(`Tool ${toolName} parameters:`, JSON.stringify(parameters));

              built[toolName] = {
                description: resolvedTool.description,
                parameters,
                execute: async (args: any, ctx: any) => {
                  const toolCallId = ctx?.toolCallId || ctx?.id;
                  const execResult = await this.agentToolExecutor.execute({
                    threadId,
                    // 这里没有 assistant messageId，先用 user message id 关联即可
                    messageId: userMsg.id,
                    teamId,
                    userId,
                    toolCallId,
                    toolName,
                    args,
                  });

                  if (execResult.success) return execResult.result;
                  throw new Error(execResult.error?.message || 'Tool execution failed');
                },
              };
              this.logger.debug(`Registered server-side tool: ${toolName}`);
            } catch (e) {
              this.logger.warn(`Failed to load tool ${toolName}: ${e?.message || e}`);
            }
          }

          tools = Object.keys(built).length > 0 ? built : undefined;
          this.logger.log(
            `✅ Tools prepared for agent ${agent.id} (${agent.name}): ${
              tools ? `enabled (${Object.keys(tools).length} server-side tools)` : 'disabled (no server-side tools)'
            }`,
          );
        } catch (error) {
          this.logger.error(`❌ Failed to prepare tools for agent ${agent?.id}:`, error);
        }
      } else {
        this.logger.warn(
          `⚠️ Tools not enabled for agent. agent?.config.tools?.enabled = ${agent?.config.tools?.enabled}`,
        );
      }

      this.logger.log(`🚀 Starting AI SDK stream for thread ${threadId}, tools: ${tools ? `enabled (${Object.keys(tools || {}).length} tools)` : 'disabled'}`);

      // 9. 使用 AI SDK streamText（包含工具）
      const result = streamText({
        model,
        system: systemPrompt,
        messages: messages as any,
        temperature,
        tools,
      });

      // 10. 在后台处理完整流（包含工具调用）
      (async () => {
        try {
          const parts: UIMessagePart[] = [];
          const toolCalls: any[] = [];

          // 🔧 FIX: 先创建初始 assistant 消息,以满足 tool_calls 表的外键约束
          const initialMessage = await this.messageService.create({
            threadId,
            teamId,
            role: 'assistant',
            parts: [], // 初始为空,稍后更新
            metadata: {},
          });
          const messageId = initialMessage.id;
          this.logger.debug(`Created initial assistant message ${messageId} for thread ${threadId}`);

          // 监听完整流事件
          for await (const event of result.fullStream) {
            if (event.type === 'text-delta') {
              // 文本增量 - 在完成时一起保存
            } else if (event.type === 'tool-call') {
              // 工具调用事件
              const toolCallId = event.toolCallId;
              const toolName = event.toolName;
              const args = (event as any).args || event.input;

              this.logger.debug(`Tool call: ${toolName} (${toolCallId})`);

              // 检查工具是否为前端执行类型
              try {
                const tool = await this.agentToolRegistry.getToolByName(toolName, teamId);
                const isClientSide = tool?.metadata?.clientSide === true;

                if (isClientSide) {
                  // 前端执行的工具，跳过后端执行，仅记录调用
                  this.logger.debug(`Tool ${toolName} is client-side, skipping backend execution`);
                  toolCalls.push({
                    toolCallId,
                    toolName,
                    args,
                    result: null, // 结果由前端提供
                    clientSide: true,
                  });
                  continue;
                }
              } catch (error) {
                this.logger.warn(`Failed to check tool ${toolName} metadata:`, error.message);
              }

              // 后端执行工具 - 使用真实的 messageId
              try {
                const toolResult = await this.agentToolExecutor.execute({
                  threadId,
                  messageId, // 🔧 使用真实的消息 ID
                  teamId,
                  userId,
                  toolCallId,
                  toolName,
                  args,
                });

                toolCalls.push({
                  toolCallId,
                  toolName,
                  args,
                  result: toolResult.result,
                  error: toolResult.error,
                });
              } catch (error) {
                this.logger.error(`Tool execution failed for ${toolName}:`, error);
                toolCalls.push({
                  toolCallId,
                  toolName,
                  args,
                  error: {
                    message: error.message || 'Tool execution failed',
                  },
                });
              }
            }
          }

          // 获取最终结果
          const fullText = await result.text;
          const usage = await result.usage;
          const finishReason = await result.finishReason;

          // 构建消息 parts
          if (fullText) {
            parts.push({ type: 'text', text: fullText });
          }

          // 添加工具调用 parts
          for (const tc of toolCalls) {
            parts.push({
              type: 'tool-call',
              toolCallId: tc.toolCallId,
              toolName: tc.toolName,
              args: tc.args,
              state: tc.error ? 'output-error' : 'output-available',
              result: tc.result,
              isError: !!tc.error,
            } as any);

            if (tc.result || tc.error) {
              parts.push({
                type: 'tool-result',
                toolCallId: tc.toolCallId,
                toolName: tc.toolName,
                result: tc.result || tc.error,
                isError: !!tc.error,
              } as any);
            }
          }

          // 🔧 FIX: 更新消息内容(而不是创建新消息)
          await this.messageService.update(messageId, {
            parts,
            metadata: {
              model: modelId,
              tokens: usage
                ? {
                    prompt: (usage as any).promptTokens || 0,
                    completion: (usage as any).completionTokens || 0,
                    total: (usage as any).totalTokens || 0,
                  }
                : undefined,
              finishReason: finishReason as any,
            },
          });

          await this.threadService.setRunning(threadId, false, teamId);
        } catch (error) {
          this.logger.error(`Error saving message for thread ${threadId}:`, error);
          await this.threadService.setRunning(threadId, false, teamId);
        }
      })();

      // 11. 返回 AI SDK 标准流响应
      return result;
    } catch (error) {
      this.logger.error(`Stream error for thread ${threadId}:`, error);
      await this.threadService.setRunning(threadId, false, teamId);
      throw error;
    }
  }

  /**
   * 旧的 SSE 格式流式处理（向后兼容）
   */
  async *streamAgentResponse(opts: StreamOptions): AsyncGenerator<string> {
    const { threadId, teamId, userId, userMessage, imageMediaIds, agentId } = opts;

    try {
      // 1. 设置 Thread 为运行状态
      await this.threadService.setRunning(threadId, true, teamId);

      // 2. 保存用户消息
      await this.messageService.saveUserMessage({
        threadId,
        teamId,
        text: userMessage,
        mediaIds: imageMediaIds,
      });

      // 3. 获取或创建 Agent 配置（如果提供了 agentId）
      let agent = null;
      if (agentId) {
        try {
          // 尝试获取或自动创建默认 agent
          this.logger.debug(`[SSE] Attempting to get or create agent: ${agentId}`);
          agent = await this.agentService.getOrCreateDefaultAgent(agentId, teamId, userId);
          this.logger.debug(`[SSE] Agent resolved: ${agent.id}, name: ${agent.name}`);
        } catch (error) {
          this.logger.error(`[SSE] Failed to get or create default agent ${agentId}:`, error);
          // 如果不是默认 agent 且不存在，尝试直接获取
          if (error instanceof NotFoundException) {
            try {
              agent = await this.agentService.get(agentId, teamId);
              this.logger.debug(`[SSE] Agent found by direct lookup: ${agent.id}`);
            } catch {
              this.logger.warn(`[SSE] Agent ${agentId} not found, using default configuration`);
              // 继续执行，使用默认配置
            }
          } else {
            // 其他错误，抛出
            throw error;
          }
        }
      }

      // 4. 确定使用的模型
      const modelId = opts.modelId || agent?.config.model || 'openai:gpt-4';
      const model = this.modelRegistry.resolveModel(modelId);

      // 5. 获取历史消息
      const history = await this.messageService.getThreadHistory(threadId, teamId);

      // 6. 构建系统提示词
      const systemPrompt = this.buildSystemPrompt(opts.systemPrompt || agent?.config.instructions);
      const messages: Message[] = [{ role: 'system', content: systemPrompt }, ...history];

      // 7. 准备模型参数
      const temperature = opts.temperature ?? agent?.config.temperature ?? 0.7;

      // 8. 开始流式处理
      this.logger.debug(`Starting stream for thread ${threadId} with model ${modelId}`);

      // AI SDK v6 streamText 参数
      const stream = streamText({
        model,
        messages: messages as any, // AI SDK v6 会自动处理消息格式
        temperature,
        // maxTokens 在 v6 中可能不在顶层参数，而是在 model 配置中
        // tools: 稍后添加工具支持
      });

      // 9. 处理流式事件
      const assistantParts: UIMessagePart[] = [];
      let textContent = '';

      // AI SDK v6 使用 textStream
      for await (const chunk of stream.textStream) {
        // 文本增量
        textContent += chunk;

        yield this.sseEvent({
          type: 'content_delta',
          delta: chunk,
          timestamp: Date.now(),
        });
      }

      // 10. 等待流完成并获取结果
      const result = await stream;

      // 保存 assistant 消息
      if (textContent) {
        assistantParts.push({ type: 'text', text: textContent });
      }

      // AI SDK v6 的 usage 和 finishReason 结构
      const usage = await result.usage;
      const finishReason = await result.finishReason;

      await this.messageService.saveAssistantMessage({
        threadId,
        teamId,
        parts: assistantParts,
        metadata: {
          model: modelId,
          tokens: usage
            ? {
                prompt: (usage as any).promptTokens || 0,
                completion: (usage as any).completionTokens || 0,
                total: (usage as any).totalTokens || 0,
              }
            : undefined,
          finishReason: finishReason as any,
        },
      });

      // 11. 发送完成事件
      yield this.sseEvent({
        type: 'done',
        usage: usage,
        finishReason: finishReason,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(`Stream error for thread ${threadId}:`, error);

      yield this.sseEvent({
        type: 'error',
        error: error.message,
        timestamp: Date.now(),
      });
    } finally {
      // 12. 设置 Thread 为非运行状态
      await this.threadService.setRunning(threadId, false, teamId);
    }
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(customPrompt?: string): string {
    const base = `You are a helpful AI assistant powered by Monkeys platform.`;
    const withCustom = customPrompt ? `${base}\n\n${customPrompt}` : base;

    // 添加canvas context提示
    const canvasContextAddition = this.canvasContextService.getCanvasContextSystemPromptAddition();
    return `${withCustom}${canvasContextAddition}`;
  }

  /**
   * 格式化为 SSE 事件
   */
  private sseEvent(data: SSEEvent): string {
    return `data: ${JSON.stringify(data)}\n\n`;
  }
}
