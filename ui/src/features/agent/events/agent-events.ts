/**
 * Agent Events - 自定义事件系统
 * 类似 workflow mini-mode 的事件系统，用于 Agent 的打开/关闭和状态同步
 */

/**
 * Agent 事件类型
 */
export type AgentEventType =
  | 'agent:open'
  | 'agent:close'
  | 'agent:toggle'
  | 'agent:state-change'
  | 'agent:thread-created'
  | 'agent:thread-switched'
  | 'agent:message-sent';

/**
 * Agent 打开事件详情
 */
export interface AgentOpenEventDetail {
  agentId: string;
  threadId?: string;
  teamId: string;
  userId: string;
  position?: 'left' | 'right';
}

/**
 * Agent 关闭事件详情
 */
export interface AgentCloseEventDetail {
  agentId?: string;
}

/**
 * Agent 状态变化事件详情
 */
export interface AgentStateChangeEventDetail {
  agentId: string | null;
  threadId: string | null;
  isOpen: boolean;
}

/**
 * Agent 线程创建事件详情
 */
export interface AgentThreadCreatedEventDetail {
  agentId: string;
  threadId: string;
}

/**
 * Agent 线程切换事件详情
 */
export interface AgentThreadSwitchedEventDetail {
  agentId: string;
  threadId: string;
  previousThreadId: string | null;
}

/**
 * Agent 消息发送事件详情
 */
export interface AgentMessageSentEventDetail {
  agentId: string;
  threadId: string;
  messageId: string;
  message: string;
}

/**
 * Agent 事件详情类型映射
 */
export interface AgentEventDetailMap {
  'agent:open': AgentOpenEventDetail;
  'agent:close': AgentCloseEventDetail;
  'agent:toggle': AgentOpenEventDetail;
  'agent:state-change': AgentStateChangeEventDetail;
  'agent:thread-created': AgentThreadCreatedEventDetail;
  'agent:thread-switched': AgentThreadSwitchedEventDetail;
  'agent:message-sent': AgentMessageSentEventDetail;
}

/**
 * 派发 Agent 事件
 */
export function dispatchAgentEvent<T extends AgentEventType>(
  type: T,
  detail: AgentEventDetailMap[T]
): void {
  const event = new CustomEvent(type, { detail });
  window.dispatchEvent(event);
}

/**
 * 监听 Agent 事件
 */
export function onAgentEvent<T extends AgentEventType>(
  type: T,
  handler: (detail: AgentEventDetailMap[T]) => void
): () => void {
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<AgentEventDetailMap[T]>;
    handler(customEvent.detail);
  };

  window.addEventListener(type, listener);

  // 返回取消监听的函数
  return () => {
    window.removeEventListener(type, listener);
  };
}

/**
 * 打开 Agent
 */
export function openAgent(detail: AgentOpenEventDetail): void {
  dispatchAgentEvent('agent:open', detail);
}

/**
 * 关闭 Agent
 */
export function closeAgent(agentId?: string): void {
  dispatchAgentEvent('agent:close', { agentId });
}

/**
 * 切换 Agent 显示状态
 */
export function toggleAgent(detail: AgentOpenEventDetail): void {
  dispatchAgentEvent('agent:toggle', detail);
}

/**
 * 更新 Agent 状态
 */
export function updateAgentState(detail: AgentStateChangeEventDetail): void {
  dispatchAgentEvent('agent:state-change', detail);
}

/**
 * 通知线程创建
 */
export function notifyThreadCreated(agentId: string, threadId: string): void {
  dispatchAgentEvent('agent:thread-created', { agentId, threadId });
}

/**
 * 通知线程切换
 */
export function notifyThreadSwitched(
  agentId: string,
  threadId: string,
  previousThreadId: string | null
): void {
  dispatchAgentEvent('agent:thread-switched', { agentId, threadId, previousThreadId });
}

/**
 * 通知消息发送
 */
export function notifyMessageSent(
  agentId: string,
  threadId: string,
  messageId: string,
  message: string
): void {
  dispatchAgentEvent('agent:message-sent', { agentId, threadId, messageId, message });
}

/**
 * Hook: 使用 Agent 事件监听
 */
import { useEffect } from 'react';

export function useAgentEvent<T extends AgentEventType>(
  type: T,
  handler: (detail: AgentEventDetailMap[T]) => void,
  deps: React.DependencyList = []
): void {
  useEffect(() => {
    return onAgentEvent(type, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * 使用示例:
 *
 * ```tsx
 * // 打开 Agent
 * openAgent({
 *   agentId: 'agent-123',
 *   teamId: 'team-456',
 *   userId: 'user-789',
 *   position: 'right',
 * });
 *
 * // 监听 Agent 打开事件
 * useAgentEvent('agent:open', (detail) => {
 *   console.log('Agent opened:', detail.agentId);
 * });
 *
 * // 监听 Agent 状态变化
 * useAgentEvent('agent:state-change', (detail) => {
 *   if (detail.isOpen) {
 *     console.log('Agent is now open');
 *   }
 * });
 * ```
 */
