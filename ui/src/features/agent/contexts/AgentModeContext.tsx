/**
 * Agent Mode Context
 * 提供 Agent 模式配置的上下文
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AgentMode, AgentModeConfig } from '../types/agent.types';

/**
 * Agent Mode Context 类型
 */
interface AgentModeContextValue extends AgentModeConfig {
  /** 是否为 normal 模式 */
  isNormalMode: boolean;
  /** 是否为 mini 模式 */
  isMiniMode: boolean;
  /** 是否为 embed 模式 */
  isEmbedMode: boolean;
  /** 是否为紧凑模式（mini 或 embed） */
  isCompactMode: boolean;
}

/**
 * 默认配置
 */
const defaultModeConfig: AgentModeConfig = {
  mode: 'normal',
  showThreadList: true,
  compact: false,
  resizable: true,
  position: 'left',
};

/**
 * Context 实例
 */
const AgentModeContext = createContext<AgentModeContextValue | undefined>(undefined);

/**
 * Provider Props
 */
interface AgentModeProviderProps {
  children: ReactNode;
  mode?: AgentMode;
  modeConfig?: Partial<AgentModeConfig>;
}

/**
 * Agent Mode Provider
 */
export function AgentModeProvider({ children, mode = 'normal', modeConfig }: AgentModeProviderProps) {
  const config: AgentModeConfig = useMemo(
    () => ({
      ...defaultModeConfig,
      ...modeConfig,
      mode,
    }),
    [mode, modeConfig],
  );

  const value: AgentModeContextValue = useMemo(
    () => ({
      ...config,
      isNormalMode: config.mode === 'normal',
      isMiniMode: config.mode === 'mini',
      isEmbedMode: config.mode === 'embed',
      isCompactMode: config.mode === 'mini' || config.mode === 'embed',
    }),
    [config],
  );

  return <AgentModeContext.Provider value={value}>{children}</AgentModeContext.Provider>;
}

/**
 * Hook to use Agent Mode
 * @throws Error if used outside of AgentModeProvider
 */
export function useAgentMode(): AgentModeContextValue {
  const context = useContext(AgentModeContext);
  if (!context) {
    throw new Error('useAgentMode must be used within AgentModeProvider');
  }
  return context;
}

/**
 * Hook to safely use Agent Mode (returns null if not available)
 */
export function useAgentModeOptional(): AgentModeContextValue | null {
  return useContext(AgentModeContext) ?? null;
}
