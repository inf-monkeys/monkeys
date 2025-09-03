// Agent V2 creation and runtime configuration types
// Separated from global config to maintain clear boundaries

/**
 * Configuration provided when creating an agent
 * These settings are specific to each agent instance
 */
export interface AgentV2CreationConfig {
  // Model selection (required, must be from global config models list)
  model: string;

  // Model parameters (optional with defaults from global config)
  temperature?: number; // 0-2, controls creativity/randomness
  maxTokens?: number; // Maximum tokens in response
  timeout?: number; // Request timeout in milliseconds

  // Reasoning effort (manual enable required, similar to agent-code)
  reasoningEffort?: {
    enabled: boolean; // Must manually enable
    level?: 'low' | 'medium' | 'high'; // Required if enabled
  };
}

/**
 * Default values for agent creation config
 * These will be used if values are not provided during creation
 */
export const DEFAULT_AGENT_CREATION_CONFIG = {
  temperature: 0.7,
  maxTokens: 4096,
  timeout: 30000,
  reasoningEffort: {
    enabled: false,
    level: 'medium' as const,
  },
};

/**
 * Validation helper for agent creation configuration
 */
export class AgentV2ConfigValidator {
  /**
   * Validates agent creation configuration
   * @param config Configuration to validate
   * @param availableModels List of available models from global config
   * @returns Validation result with errors if any
   */
  static validateCreationConfig(config: AgentV2CreationConfig, availableModels: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Model validation (required)
    if (!config.model) {
      errors.push('Model is required and must be specified');
    } else if (!availableModels.includes(config.model)) {
      errors.push(`Model "${config.model}" is not available. Available models: ${availableModels.join(', ')}`);
    }

    // Temperature validation
    if (config.temperature !== undefined) {
      if (config.temperature < 0 || config.temperature > 2) {
        errors.push('Temperature must be between 0 and 2');
      }
    }

    // Max tokens validation
    if (config.maxTokens !== undefined) {
      if (config.maxTokens < 1 || config.maxTokens > 100000) {
        errors.push('Max tokens must be between 1 and 100000');
      }
    }

    // Timeout validation
    if (config.timeout !== undefined) {
      if (config.timeout < 1000 || config.timeout > 300000) {
        // 1s to 5min
        errors.push('Timeout must be between 1000ms (1s) and 300000ms (5min)');
      }
    }

    // Reasoning effort validation
    if (config.reasoningEffort) {
      if (config.reasoningEffort.enabled && !config.reasoningEffort.level) {
        errors.push('Reasoning effort level is required when reasoning effort is enabled');
      }
      if (config.reasoningEffort.level && !['low', 'medium', 'high'].includes(config.reasoningEffort.level)) {
        errors.push('Reasoning effort level must be "low", "medium", or "high"');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Merges user config with defaults
   * @param userConfig User provided configuration
   * @returns Complete configuration with defaults applied
   */
  static mergeWithDefaults(userConfig: AgentV2CreationConfig): Required<AgentV2CreationConfig> {
    return {
      model: userConfig.model, // Required field, no default
      temperature: userConfig.temperature ?? DEFAULT_AGENT_CREATION_CONFIG.temperature,
      maxTokens: userConfig.maxTokens ?? DEFAULT_AGENT_CREATION_CONFIG.maxTokens,
      timeout: userConfig.timeout ?? DEFAULT_AGENT_CREATION_CONFIG.timeout,
      reasoningEffort: {
        enabled: userConfig.reasoningEffort?.enabled ?? DEFAULT_AGENT_CREATION_CONFIG.reasoningEffort.enabled,
        level: userConfig.reasoningEffort?.level ?? DEFAULT_AGENT_CREATION_CONFIG.reasoningEffort.level,
      },
    };
  }
}

/**
 * Runtime configuration extracted from stored agent config
 * Used during agent execution
 */
export interface AgentV2RuntimeConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  reasoningEffort: {
    enabled: boolean;
    level: 'low' | 'medium' | 'high';
  };
}

/**
 * Helper to extract runtime config from stored agent entity
 */
export class AgentV2ConfigHelper {
  static getRuntimeConfig(agent: { config?: Record<string, any> }): AgentV2RuntimeConfig {
    const storedConfig = (agent.config as Partial<AgentV2CreationConfig>) || {};
    const mergedConfig = AgentV2ConfigValidator.mergeWithDefaults({
      model: storedConfig.model || 'gpt-3.5-turbo', // Fallback if somehow missing
      ...storedConfig,
    });

    // Ensure runtime config has required level when enabled
    const runtimeConfig: AgentV2RuntimeConfig = {
      model: mergedConfig.model,
      temperature: mergedConfig.temperature,
      maxTokens: mergedConfig.maxTokens,
      timeout: mergedConfig.timeout,
      reasoningEffort: {
        enabled: mergedConfig.reasoningEffort.enabled,
        level: mergedConfig.reasoningEffort.level!, // level is required in runtime config
      },
    };

    return runtimeConfig;
  }

  static shouldUseReasoningEffort(agent: { config?: Record<string, any> }): boolean {
    const runtimeConfig = this.getRuntimeConfig(agent);
    return runtimeConfig.reasoningEffort.enabled;
  }

  static getReasoningEffortLevel(agent: { config?: Record<string, any> }): 'low' | 'medium' | 'high' {
    const runtimeConfig = this.getRuntimeConfig(agent);
    return runtimeConfig.reasoningEffort.level;
  }
}
