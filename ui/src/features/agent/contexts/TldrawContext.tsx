/**
 * TldrawContext - 提供 tldraw editor 实例给 agent 工具使用
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { Editor } from 'tldraw';

interface TldrawContextValue {
  editor: Editor | null;
}

const TldrawContext = createContext<TldrawContextValue | null>(null);

interface TldrawProviderProps {
  children: ReactNode;
  editor: Editor | null;
}

export function TldrawProvider({ children, editor }: TldrawProviderProps) {
  return (
    <TldrawContext.Provider value={{ editor }}>
      {children}
    </TldrawContext.Provider>
  );
}

/**
 * Hook to access tldraw editor from agent tools
 */
export function useTldrawEditor() {
  const context = useContext(TldrawContext);
  if (!context) {
    throw new Error('useTldrawEditor must be used within TldrawProvider');
  }
  return context.editor;
}

/**
 * Optional version that returns null if not in context
 */
export function useTldrawEditorOptional() {
  const context = useContext(TldrawContext);
  return context?.editor ?? null;
}
