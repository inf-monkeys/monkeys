import { useTldrawAgentV2 } from '@/agent/useTldrawAgentV2';
import React, { useRef, useState } from 'react';
import type { Editor } from 'tldraw';

interface TldrawAgentV2EmbeddedPanelProps {
  editor: Editor | null;
  onClose?: () => void;
}

export const TldrawAgentV2EmbeddedPanel: React.FC<TldrawAgentV2EmbeddedPanelProps> = ({ editor, onClose }) => {
  const agentApi = useTldrawAgentV2(editor);
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
    if (!agentApi || !input.trim()) return;
    const text = input;
    setInput('');
    // 立即触发，不等待完成，避免阻塞首屏显示
    agentApi.request({ message: text });
    setTimeout(() => scrollRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }), 0);
  };

  const reset = () => {
    agentApi?.reset();
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
          const resp = await fetch('/api/tldraw-agent/transcribe', {
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
            agentApi?.request({ message: text });
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
    <div className="bg-white rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] w-full h-full flex flex-col overflow-hidden">
      <style>{`@keyframes agent-spinner { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
      <div className="flex flex-col gap-0 h-full">
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto p-3 flex flex-col gap-2.5"
        >
          {(agentApi?.history ?? []).length === 0 && (
            <div className="text-gray-400 text-xs">开始与 Agent V2 对话，它会理解画布并执行操作。</div>
          )}
          {(agentApi?.history ?? []).map((m, idx) => {
            const matchedVoice =
              m.role === 'user'
                ? voiceList.find((v) => v.text === m.content && Math.abs((m as any).timestamp - v.timestamp) < 8000)
                : undefined;
            const isVoice = !!matchedVoice;
            return (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {isVoice ? (
                  <div className="max-w-[80%] px-3 py-2.5 rounded-[10px] bg-[rgb(65,104,135)] text-white text-[13px] whitespace-pre-wrap">
                    <div className="flex items-center gap-1.5 mb-1">
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
                      <span className="opacity-90 text-white">{(matchedVoice?.duration ?? 0) + '"'}</span>
                    </div>
                    <div className="opacity-95 text-white">{m.content}</div>
                  </div>
                ) : (
                  <div
                    className={`max-w-[80%] px-2.5 py-2 rounded-[10px] text-[13px] whitespace-pre-wrap ${
                      m.role === 'user' ? 'bg-[#416887] text-white' : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {m.role === 'assistant' ? renderContent(m.content) : m.content}
                    {m.role === 'assistant' && agentApi?.isStreaming && idx === (agentApi?.history?.length ?? 1) - 1 && (
                      <span className="inline-block ml-1.5 w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-[agent-spinner_0.9s_linear_infinite] align-middle" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t border-gray-200">
          <div className="relative bg-gray-100 border border-gray-200 rounded-xl">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="输入您的需求…"
              rows={3}
              className="w-full resize-none outline-none border-none bg-transparent py-3 px-11 pr-12 text-[13px]"
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
              className="absolute left-2.5 bottom-2.5 w-6 h-6 rounded-full border border-gray-200 bg-white text-gray-500 flex items-center justify-center cursor-pointer"
              onClick={() => {
                /* 预留：打开更多操作 */
              }}
            >
              <span className="text-base leading-none">+</span>
            </button>
            {/* 右侧语音图标，点击开始/结束录音 */}
            <button
              title={isRecording ? '停止' : '语音'}
              className={`absolute right-12 bottom-2.5 w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center cursor-pointer ${
                isRecording ? 'bg-yellow-200 text-yellow-700' : 'bg-white text-gray-500'
              }`}
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
              className="absolute right-2.5 bottom-2.5 w-7 h-7 rounded-full border-none bg-[#4D8F9D] text-white flex items-center justify-center cursor-pointer"
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
          <button onClick={() => agentApi?.cancel()} className="hidden">
            取消
          </button>
          <button onClick={reset} className="hidden" />
        </div>
      </div>
    </div>
  );
};
