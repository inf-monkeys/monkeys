import { Injectable, Logger } from '@nestjs/common';

export interface McpServer {
  name: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  type?: 'stdio' | 'sse' | 'streamable-http';
  disabled?: boolean;
  timeout?: number;
  alwaysAllow?: string[];
  disabledTools?: string[];
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface McpToolCallResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    resource?: any;
  }>;
  isError?: boolean;
}

export interface McpResourceResponse {
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  }>;
}

@Injectable()
export class AgentV2McpService {
  private readonly logger = new Logger(AgentV2McpService.name);
  private connectedServers = new Map<string, any>();
  private serverTools = new Map<string, McpTool[]>();
  private serverResources = new Map<string, McpResource[]>();

  /**
   * Initialize MCP server connection
   * 在实际实现中，这里会连接到MCP服务器
   */
  async initializeServer(server: McpServer): Promise<boolean> {
    if (server.disabled) {
      this.logger.warn(`MCP server ${server.name} is disabled`);
      return false;
    }

    try {
      // 这里应该实现实际的MCP连接逻辑
      // 暂时使用模拟实现
      const mockConnection = {
        name: server.name,
        connected: true,
        tools: this.getMockTools(server.name),
        resources: this.getMockResources(server.name),
      };

      this.connectedServers.set(server.name, mockConnection);
      this.serverTools.set(server.name, mockConnection.tools);
      this.serverResources.set(server.name, mockConnection.resources);

      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize MCP server ${server.name}: ${error.message}`);
      return false;
    }
  }

  /**
   * List available tools from all connected servers
   */
  async listAllTools(): Promise<Record<string, McpTool[]>> {
    const allTools: Record<string, McpTool[]> = {};

    for (const [serverName, tools] of this.serverTools.entries()) {
      allTools[serverName] = tools;
    }

    return allTools;
  }

  /**
   * List tools from a specific server
   */
  async listServerTools(serverName: string): Promise<McpTool[]> {
    return this.serverTools.get(serverName) || [];
  }

  /**
   * List resources from a specific server
   */
  async listServerResources(serverName: string): Promise<McpResource[]> {
    return this.serverResources.get(serverName) || [];
  }

  /**
   * Execute a tool on an MCP server
   */
  async callTool(serverName: string, toolName: string, args: Record<string, unknown> = {}): Promise<McpToolCallResponse> {
    const server = this.connectedServers.get(serverName);
    if (!server) {
      throw new Error(`MCP server '${serverName}' not found or not connected`);
    }

    const tools = this.serverTools.get(serverName) || [];
    const tool = tools.find((t) => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found on server '${serverName}'`);
    }

    try {
      // 这里应该实现实际的MCP工具调用
      // 暂时返回模拟响应
      const mockResponse: McpToolCallResponse = {
        content: [
          {
            type: 'text',
            text: `Mock response from ${serverName}/${toolName} with args: ${JSON.stringify(args)}`,
          },
        ],
      };

      return mockResponse;
    } catch (error) {
      this.logger.error(`Error calling MCP tool ${serverName}/${toolName}: ${error.message}`);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Read a resource from an MCP server
   */
  async readResource(serverName: string, uri: string): Promise<McpResourceResponse> {
    const server = this.connectedServers.get(serverName);
    if (!server) {
      throw new Error(`MCP server '${serverName}' not found or not connected`);
    }

    try {
      // 这里应该实现实际的MCP资源读取
      // 暂时返回模拟响应
      const mockResponse: McpResourceResponse = {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: `Mock content from ${serverName} resource: ${uri}`,
          },
        ],
      };

      return mockResponse;
    } catch (error) {
      this.logger.error(`Error reading MCP resource ${serverName}/${uri}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if a server is connected
   */
  isServerConnected(serverName: string): boolean {
    const server = this.connectedServers.get(serverName);
    return server && server.connected;
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnectServer(serverName: string): Promise<void> {
    const server = this.connectedServers.get(serverName);
    if (server) {
      // 这里应该实现实际的断连逻辑
      this.connectedServers.delete(serverName);
      this.serverTools.delete(serverName);
      this.serverResources.delete(serverName);
    }
  }

  /**
   * Get mock tools for testing (replace with actual MCP tool discovery)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getMockTools(_serverName: string): McpTool[] {
    return [
      {
        name: 'echo',
        description: 'Echo back the input message',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Message to echo' },
          },
          required: ['message'],
        },
      },
      {
        name: 'calculate',
        description: 'Perform basic calculations',
        inputSchema: {
          type: 'object',
          properties: {
            expression: { type: 'string', description: 'Mathematical expression to evaluate' },
          },
          required: ['expression'],
        },
      },
    ];
  }

  /**
   * Get mock resources for testing (replace with actual MCP resource discovery)
   */
  private getMockResources(serverName: string): McpResource[] {
    return [
      {
        uri: `${serverName}://config`,
        name: 'Configuration',
        description: 'Server configuration',
        mimeType: 'application/json',
      },
      {
        uri: `${serverName}://status`,
        name: 'Status',
        description: 'Server status information',
        mimeType: 'text/plain',
      },
    ];
  }
}
