import { useTldrawAgent } from '@/agent/useTldrawAgent';
import React, { useRef, useState } from 'react';
import type { Editor } from 'tldraw';

interface AgentEmbeddedPanelProps {
  editor: Editor | null;
  onClose?: () => void;
}

export const AgentEmbeddedPanel: React.FC<AgentEmbeddedPanelProps> = ({ editor, onClose }) => {
  const agent = useTldrawAgent(editor);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const renderContent = (content: string) => {
    // 将 <think>...</think> 与正文拆分渲染
    const parts: Array<{ type: 'think' | 'text'; text: string }> = [];
    const re = /<think>([\s\S]*?)<\/think>/g;
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      if (m.index > lastIndex) {
        parts.push({ type: 'text', text: content.slice(lastIndex, m.index) });
      }
      parts.push({ type: 'think', text: m[1] });
      lastIndex = re.lastIndex;
    }
    if (lastIndex < content.length) {
      parts.push({ type: 'text', text: content.slice(lastIndex) });
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {parts.map((p, i) =>
          p.type === 'think' ? (
            <div
              key={i}
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 12,
                color: '#6b7280',
                background: '#f9fafb',
                border: '1px dashed #e5e7eb',
                borderLeft: '3px solid #9ca3af',
                borderRadius: 6,
                padding: '8px 10px',
                whiteSpace: 'pre-wrap',
              }}
            >
              {p.text.trim()}
            </div>
          ) : (
            <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{p.text}</span>
          ),
        )}
      </div>
    );
  };

  const run = async () => {
    if (!agent || !input.trim()) return;
    const text = input;
    setInput('');
    // 立即触发，不等待完成，避免阻塞首屏显示
    agent.prompt({ message: text });
    setTimeout(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }), 0);
  };

  const reset = () => {
    agent?.reset();
    setTimeout(() => scrollRef.current?.scrollTo({ top: 0 }), 0);
  };

  return (
    <div
      style={{
        background: 'white',
        borderRadius: 16,
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <style>{`@keyframes agent-spinner { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
        <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(agent?.history ?? []).length === 0 && (
            <div style={{ color: '#9ca3af', fontSize: 12 }}>开始与 Agent 对话，它会理解画布并执行操作。</div>
          )}
          {(agent?.history ?? []).map((m, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%',
                padding: '8px 10px',
                borderRadius: 10,
                background: m.role === 'user' ? '#111' : '#f3f4f6',
                color: m.role === 'user' ? '#fff' : '#111',
                fontSize: 13,
                whiteSpace: 'pre-wrap'
              }}>
                {m.role === 'assistant' ? renderContent(m.content) : m.content}
                {m.role === 'assistant' && agent?.isStreaming && idx === (agent?.history?.length ?? 1) - 1 && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginLeft: 6,
                      width: 12,
                      height: 12,
                      border: '2px solid #d1d5db',
                      borderTopColor: '#6b7280',
                      borderRadius: '50%',
                      animation: 'agent-spinner 0.9s linear infinite',
                      verticalAlign: 'middle',
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: '1px solid #e5e7eb' }}>
          <div style={{ position: 'relative', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 12 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入您的需求…"
              rows={3}
              style={{
                width: '100%',
                resize: 'none',
                outline: 'none',
                border: 'none',
                background: 'transparent',
                padding: '12px 48px 12px 44px',
                fontSize: 13,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  run();
                }
              }}
            />
            {/* 左侧加号 */}
            <button
              title="更多"
              style={{
                position: 'absolute',
                left: 10,
                bottom: 10,
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '1px solid #e5e7eb',
                background: '#fff',
                color: '#6b7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
              onClick={() => { /* 预留：打开更多操作 */ }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            </button>
            {/* 右侧语音图标（占位） */}
            <button
              title="语音"
              style={{
                position: 'absolute',
                right: 52,
                bottom: 10,
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '1px solid #e5e7eb',
                background: '#fff',
                color: '#6b7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
              onClick={() => { /* 预留：语音输入 */ }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </button>
            {/* 右侧发送按钮 */}
            <button
              title="发送"
              onClick={run}
              style={{
                position: 'absolute',
                right: 10,
                bottom: 10,
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: 'none',
                background: '#2f7f86',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <button onClick={() => agent?.cancel()} style={{ display: 'none' }}>取消</button>
          <button onClick={reset} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  );
};


