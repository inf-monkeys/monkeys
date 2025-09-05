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
