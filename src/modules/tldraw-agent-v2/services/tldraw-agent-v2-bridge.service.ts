import { Injectable, Logger } from '@nestjs/common';
import { AgentV2Repository } from '../../agent-v2/services/agent-v2.repository';
import { AgentV2Service } from '../../agent-v2/services/agent-v2.service';
import { TldrawToolExecutorService } from './tldraw-tool-executor.service';
import { TldrawToolContext, TldrawToolsRegistryService } from './tldraw-tools-registry.service';

export interface TldrawAgentV2Session {
  sessionId: string;
  agentId: string;
  userId: string;
  teamId: string;
  editor?: any; // tldraw Editor实例
  isActive: boolean;
}

export interface TldrawAgentV2Request {
  message: string;
  context?: {
    viewport?: any;
    selectionIds?: string[];
    shapes?: any[];
    screenshot?: string;
  };
  modelName?: string;
}

export interface TldrawAgentV2Callbacks {
  onMessage?: (chunk: string) => void;
  onToolCall?: (toolCalls: any[]) => void;
  onToolResult?: (tool: any, result: any) => void;
  onComplete?: (finalMessage: string) => void;
  onError?: (error: Error) => void;
}

@Injectable()
export class TldrawAgentV2BridgeService {
  private readonly logger = new Logger(TldrawAgentV2BridgeService.name);
  private readonly activeSessions = new Map<string, TldrawAgentV2Session>();

  constructor(
    private readonly agentV2Service: AgentV2Service,
    private readonly agentRepository: AgentV2Repository,
    private readonly toolsRegistry: TldrawToolsRegistryService,
    private readonly toolExecutor: TldrawToolExecutorService,
  ) {}

  /**
   * 启动tldraw agent-v2会话
   */
  async startSession(
    agentId: string,
    userId: string,
    teamId: string,
    editor?: any,
  ): Promise<string> {
    const sessionId = `tldraw-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    
    const session: TldrawAgentV2Session = {
      sessionId,
      agentId,
      userId,
      teamId,
      editor,
      isActive: true,
    };

    this.activeSessions.set(sessionId, session);
    this.logger.log(`Started tldraw agent-v2 session: ${sessionId}`);

    return sessionId;
  }

  /**
   * 停止会话
   */
  async stopSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);
      this.logger.log(`Stopped tldraw agent-v2 session: ${sessionId}`);
    }
  }

  /**
   * 处理tldraw agent请求
   */
  async processRequest(
    sessionId: string,
    request: TldrawAgentV2Request,
    callbacks: TldrawAgentV2Callbacks = {},
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isActive) {
      throw new Error(`Session ${sessionId} not found or inactive`);
    }

    try {
      // 确保Agent存在，如果不存在则创建默认Agent
      const agentId = await this.ensureAgentExists(session.agentId, session.teamId, session.userId);

      // 获取tldraw专用工具
      const tldrawTools = this.toolsRegistry.getAllTools();
      
      // 为agent-v2注册tldraw工具
      await this.registerTldrawToolsForAgent(agentId, tldrawTools);

      // 构建系统提示词
      const systemPrompt = this.buildTldrawSystemPrompt(tldrawTools);

      // 启动agent-v2会话
      const agentContext = await this.agentV2Service.startNewSession(
        agentId,
        session.userId,
        request.message,
        callbacks.onMessage || (() => {}),
        callbacks.onToolCall || (() => {}),
        async (tool, result) => {
          // 处理tldraw工具调用
          await this.handleTldrawToolCall(session, tool, result);
          callbacks.onToolResult?.(tool, result);
        },
        callbacks.onComplete || (() => {}),
        callbacks.onError || (() => {}),
      );

      // 设置自定义工具处理器
      this.setupTldrawToolHandler(agentContext, session);

    } catch (error) {
      this.logger.error(`Error processing tldraw agent request:`, error);
      callbacks.onError?.(error as Error);
    }
  }

  /**
   * 确保Agent存在，如果不存在则创建默认Agent
   */
  private async ensureAgentExists(agentId: string, teamId: string, userId: string): Promise<string> {
    this.logger.log(`ensureAgentExists called with agentId: ${agentId}, teamId: ${teamId}, userId: ${userId}`);
    
    try {
      // 尝试查找现有的Agent
      const existingAgent = await this.agentRepository.findAgentById(agentId);
      if (existingAgent) {
        this.logger.log(`Found existing agent: ${existingAgent.id}`);
        return agentId;
      }
    } catch (error) {
      // Agent不存在，需要创建
      this.logger.log(`Agent ${agentId} not found, creating default agent for team ${teamId} and user ${userId}`);
    }

    // 先尝试查找团队中是否已有tldraw Agent
    try {
      const teamAgents = await this.agentRepository.findAgentsByTeam(teamId, { limit: 100 });
      const existingTldrawAgent = teamAgents.agents.find(agent => 
        agent.name.includes('Tldraw Assistant') || agent.name.includes('tldraw')
      );
      
      if (existingTldrawAgent) {
        this.logger.log(`Found existing tldraw agent: ${existingTldrawAgent.id}`);
        return existingTldrawAgent.id;
      }
    } catch (error) {
      this.logger.warn(`Failed to search existing agents:`, error);
    }

    // 创建默认的tldraw Agent，使用真实的团队和用户信息
    const defaultAgentConfig = {
      name: `Tldraw Assistant ${Date.now()}`, // 使用时间戳确保名称唯一
      description: '专业的tldraw画布助手，能够创建、修改和操作画布上的图形元素',
      iconUrl: '/icons/tldraw-agent.png',
      config: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 4000,
        systemPrompt: '你是一个专业的tldraw画布助手，能够帮助用户创建、修改和操作画布上的图形元素。',
        tools: [],
        features: {
          streaming: true,
          followupQuestions: true,
          toolCalls: true,
        },
      },
    };

    try {
      this.logger.log(`Attempting to create agent with teamId: ${teamId}, userId: ${userId}`);
      const createdAgent = await this.agentRepository.createAgent({
        ...defaultAgentConfig,
        teamId,
        createdBy: userId,
      });
      
      this.logger.log(`Created default tldraw agent: ${createdAgent.id} for team ${teamId} and user ${userId}`);
      return createdAgent.id;
    } catch (error) {
      this.logger.error(`Failed to create default agent with teamId: ${teamId}, userId: ${userId}:`, error);
      throw new Error(`Unable to create or find agent ${agentId}`);
    }
  }


  /**
   * 为agent注册tldraw工具
   */
  private async registerTldrawToolsForAgent(agentId: string, tools: any[]): Promise<void> {
    // 这里需要调用agent-v2的工具注册API
    // 由于agent-v2的工具注册机制可能需要调整，这里提供一个接口
    this.logger.log(`Registering ${tools.length} tldraw tools for agent ${agentId}`);
    
    // TODO: 实现具体的工具注册逻辑
    // 可能需要修改AgentV2Service来支持动态工具注册
  }

  /**
   * 构建tldraw系统提示词
   */
  private buildTldrawSystemPrompt(tools: any[]): string {
    const toolDescriptions = tools.map(tool => 
      `- ${tool.name}: ${tool.description}`
    ).join('\n');

    return `You are a specialized tldraw canvas assistant with advanced capabilities.

CORE CAPABILITIES:
- You can create, modify, and manipulate shapes on a tldraw canvas
- You can perform complex layout operations like alignment and distribution
- You can draw freehand strokes and create artistic elements
- You can access external information sources for inspiration
- You can plan and execute multi-step drawing tasks

AVAILABLE TOOLS:
${toolDescriptions}

OPERATING RULES:
- Always respond in Simplified Chinese for natural language messages
- When users request canvas changes, you MUST use the appropriate tools
- Keep responses concise and professional
- After each tool execution, provide a brief summary of what was accomplished
- Use tools proactively to fulfill user requests rather than describing manual operations
- If a request cannot be satisfied with available tools, explain why and suggest alternatives

CONTEXT AWARENESS:
- You have access to the current canvas state including shapes, viewport, and selection
- You can see screenshots of the current canvas when needed
- You can track conversation history and maintain context across interactions

Remember: You are a powerful drawing assistant. Use your tools effectively to help users create amazing visual content!`;
  }

  /**
   * 设置tldraw工具处理器
   */
  private setupTldrawToolHandler(agentContext: any, session: TldrawAgentV2Session): void {
    // 这里需要设置agent-v2的工具调用处理器
    // 当agent-v2调用工具时，我们需要拦截tldraw工具并执行相应的操作
    
    // TODO: 实现工具调用拦截和处理逻辑
    // 可能需要修改AgentV2PersistentExecutionContext来支持自定义工具处理
  }

  /**
   * 处理tldraw工具调用
   */
  private async handleTldrawToolCall(
    session: TldrawAgentV2Session,
    tool: any,
    result: any,
  ): Promise<void> {
    const toolContext: TldrawToolContext = {
      editor: session.editor,
      sessionId: session.sessionId,
      userId: session.userId,
      teamId: session.teamId,
    };

    try {
      const executionResult = await this.toolExecutor.executeTool(tool, toolContext);
      
      if (!executionResult.success) {
        this.logger.warn(`Tool execution failed: ${executionResult.error}`);
      } else {
        this.logger.log(`Tool executed successfully: ${tool._type}`);
      }
    } catch (error) {
      this.logger.error(`Error executing tldraw tool:`, error);
    }
  }

  /**
   * 获取会话状态
   */
  getSession(sessionId: string): TldrawAgentV2Session | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * 获取所有活跃会话
   */
  getAllActiveSessions(): TldrawAgentV2Session[] {
    return Array.from(this.activeSessions.values()).filter(session => session.isActive);
  }

  /**
   * 更新会话的editor实例
   */
  updateSessionEditor(sessionId: string, editor: any): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.editor = editor;
      this.logger.log(`Updated editor for session: ${sessionId}`);
    }
  }
}
