import React, { useRef, useState } from 'react';

import type { Editor } from 'tldraw';

import { useTldrawAgent } from '@/agent/useTldrawAgent';

interface AgentEmbeddedPanelProps {
  editor: Editor | null;
  onClose?: () => void;
}

export const AgentEmbeddedPanel: React.FC<AgentEmbeddedPanelProps> = ({ editor, onClose }) => {
  const agent = useTldrawAgent(editor);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number | null>(null);
  const [voiceList, setVoiceList] = useState<Array<{ text: string; duration: number; timestamp: number }>>([]);

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
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
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
            <span key={i} style={{ whiteSpace: 'pre-wrap' }}>
              {p.text}
            </span>
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

  const toggleRecord = async () => {
    if (isRecording) {
      try {
        mediaRecorderRef.current?.stop();
      } catch {}
      setIsRecording(false);
      recordStartRef.current = recordStartRef.current;
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recordedChunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        try {
          const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          if (!blob.size) return;
          const form = new FormData();
          form.append('file', blob, 'audio.webm');
          const resp = await fetch('/api/STT', {
            method: 'POST',
            body: form,
            credentials: 'include',
          });
          const data = await resp.json().catch(() => ({ text: '' }));
          const text = String(data?.text || '').trim();
          const durationSec = recordStartRef.current
            ? Math.max(1, Math.round((Date.now() - recordStartRef.current) / 1000))
            : 0;
          const voiceTs = Date.now();
          recordStartRef.current = null;
          if (text) {
            setVoiceList((list) => [...list, { text, duration: durationSec, timestamp: voiceTs }]);
            setInput(text);
            // 直接发送
            agent?.prompt({ message: text });
            setInput('');
            setTimeout(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }), 0);
          }
        } catch (e) {
          // ignore
        } finally {
          recordedChunksRef.current = [];
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      recordStartRef.current = Date.now();
    } catch (e) {
      setIsRecording(false);
    }
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
        <div
          ref={scrollRef}
          style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}
        >
          {(agent?.history ?? []).length === 0 && (
            <div style={{ color: '#9ca3af', fontSize: 12 }}>开始与 Agent 对话，它会理解画布并执行操作。</div>
          )}
          {(agent?.history ?? []).map((m, idx) => {
            const matchedVoice =
              m.role === 'user'
                ? voiceList.find((v) => v.text === m.content && Math.abs((m as any).timestamp - v.timestamp) < 8000)
                : undefined;
            const isVoice = !!matchedVoice;
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {isVoice ? (
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'rgb(65,104,135)',
                      color: '#fff',
                      fontSize: 13,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M10.5438301421875,1.20522402375C10.2612226621875,0.9127117917500001,9.7924292421875,0.9127117917500001,9.5098224121875,1.20522402375C9.2496899361875,1.48194375375,9.2496899361875,1.91327315375,9.5098224121875,2.18999294375C12.6789412421875,5.36530444375,12.6789412421875,10.50693514375,9.5098224121875,13.68224584375C9.2218237221875,13.97060384375,9.2218237221875,14.43774284375,9.5098224121875,14.72610184375C9.7981799821875,15.01410084375,10.2653193521875,15.01410084375,10.5536774421875,14.72610184375C14.2622752421875,10.98047544375,14.2578797421875,4.94544484375,10.5438301421875,1.20522402375Z"
                          fill="#FFFFFF"
                          fillOpacity="0.8"
                        />
                        <path
                          d="M7.303897421875,3.79500763375C7.023533321875,3.54424224075,6.599493021875,3.54424224075,6.319128721875,3.79500763375C6.063781021875,4.07360598375,6.063781021875,4.50117868375,6.319128721875,4.77977669375C8.134398421875,6.60452369375,8.134398421875,9.55298229375,6.319128721875,11.37772849375C6.068363621875,11.65809349375,6.068363621875,12.08213429375,6.319128721875,12.36249829375C6.597726821875,12.61784649375,7.025298621875,12.61784649375,7.303897421875,12.36249829375C9.617761121874999,9.97535519375,9.617761121874999,6.18215129375,7.303897421875,3.79500763375ZM2.970914001875,7.15306969375C2.489838561875,7.63065289375,2.489838561875,8.40867949375,2.970914001875,8.88626389375C3.450511451875,9.37008429375,4.231873521875,9.37236829375,4.714290821875,8.891358893749999C5.196708221874999,8.410348893750001,5.196708221874999,7.62898399375,4.714290821875,7.14797399375C4.231873121875,6.66696449375,3.450511871875,6.66924829375,2.970914001875,7.15306969375Z"
                          fill="#FFFFFF"
                          fillOpacity="0.8"
                        />
                      </svg>
                      <span style={{ opacity: 0.9, color: '#fff' }}>{(matchedVoice?.duration ?? 0) + '”'}</span>
                    </div>
                    <div style={{ opacity: 0.95, color: '#fff' }}>{m.content}</div>
                  </div>
                ) : (
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: m.role === 'user' ? '#416887' : '#f3f4f6',
                      color: m.role === 'user' ? '#fff' : '#111',
                      fontSize: 13,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
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
                )}
              </div>
            );
          })}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              onClick={() => {
                /* 预留：打开更多操作 */
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            </button>
            {/* 右侧语音图标，点击开始/结束录音 */}
            <button
              title={isRecording ? '停止' : '语音'}
              style={{
                position: 'absolute',
                right: 52,
                bottom: 10,
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '1px solid #e5e7eb',
                background: isRecording ? '#fde68a' : '#fff',
                color: isRecording ? '#b45309' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              onClick={toggleRecord}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
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
                background: '#4D8F9D',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <button onClick={() => agent?.cancel()} style={{ display: 'none' }}>
            取消
          </button>
          <button onClick={reset} style={{ display: 'none' }} />
        </div>
      </div>
    </div>
  );
};
