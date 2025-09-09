export interface IAgentV2Config {
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  reasoningEffort?: {
    enabled: boolean;
    level: 'low' | 'medium' | 'high';
  };
}

export interface IAgentV2 {
  id: string;
  name: string;
  description?: string;
  teamId: string;
  createdBy: string;
  iconUrl?: string;
  config: IAgentV2Config;
  createdTimestamp: number;
  updatedTimestamp: number;
  isDeleted: boolean;
}

export interface IAgentV2ListResponse {
  success: boolean;
  data: {
    agents: IAgentV2[];
    total: number;
  };
  error?: string;
}

export interface IAgentV2DetailResponse {
  success: boolean;
  data: IAgentV2;
  error?: string;
}

export interface ICreateAgentV2Dto {
  name: string;
  description?: string;
  iconUrl?: string;
  config: IAgentV2Config;
}

// Available models API response
export interface IAvailableModelsResponse {
  success: boolean;
  data: {
    models: string[];
    defaults: {
      temperature: number;
      maxTokens: number;
      timeout: number;
    };
    constraints: {
      temperature: {
        min: number;
        max: number;
      };
      maxTokens: {
        min: number;
        max: number;
      };
      timeout: {
        min: number;
        max: number;
      };
    };
  };
  error?: string;
}

// Tool related interfaces
export interface IAgentV2BuiltinTool {
  name: string;
  displayName: string;
  description: string;
  builtin: true;
}

export interface IAgentV2ExternalTool {
  name: string;
  displayName: string | Record<string, string>;
  description: string | Record<string, string>;
  namespace: string;
  categories?: string[];
  icon?: string;
}

export interface IAvailableToolsResponse {
  success: boolean;
  data: {
    builtin: IAgentV2BuiltinTool[];
    external: {
      enabled: string[];
      available: IAgentV2ExternalTool[];
    };
  };
  error?: string;
}

export interface IAgentV2ToolsConfigResponse {
  success: boolean;
  data: {
    builtin: IAgentV2BuiltinTool[];
    external: {
      enabled: string[];
      available: Array<{
        name: string;
        displayName: string;
        description: string;
        namespace: string;
      }>;
    };
  };
  error?: string;
}

export interface IUpdateAgentV2ToolsDto {
  enabled: boolean;
  toolNames: string[];
}

export interface IAgentV2ConfigResponse {
  success: boolean;
  data: IAgentV2Config;
  error?: string;
}

export interface IUpdateAgentV2ConfigDto {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  reasoningEffort?: {
    enabled: boolean;
    level: 'low' | 'medium' | 'high';
  };
}
