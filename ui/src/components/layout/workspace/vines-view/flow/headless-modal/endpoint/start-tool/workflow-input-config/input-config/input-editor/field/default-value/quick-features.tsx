import React, { useRef, useState } from 'react';

import { Mic, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { vinesHeader } from '@/apis/utils.ts';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils';

interface IQuickFeaturesProps {
  value: string;
  onChange: (value: string) => void;
  enableVoice?: boolean;
  enableExpand?: boolean;
  isExpandLoading?: boolean;
}

export const QuickFeatures: React.FC<IQuickFeaturesProps> = ({
  value,
  onChange,
  enableVoice,
  enableExpand,
  isExpandLoading = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  const toggleRecord = async () => {
    if (isRecording) {
      try {
        mediaRecorderRef.current?.stop();
      } catch {}
      setIsRecording(false);
      recordStartRef.current = null;
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

          if (text) {
            onChange(text);
            toast.success('语音输入成功');
          }
        } catch (e) {
          toast.error('语音转写失败');
        } finally {
          recordedChunksRef.current = [];
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setIsRecording(true);
      recordStartRef.current = Date.now();
    } catch (error) {
      toast.error('无法访问麦克风');
      setIsRecording(false);
    }
  };

  const handleExpand = async () => {
    if (!value.trim()) {
      toast.error('请先输入内容');
      return;
    }

    setIsExpanding(true);
    try {
      // 调用LLM API进行扩写
      const headers = vinesHeader({ useToast: true });
      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        credentials: 'include',
        body: JSON.stringify({
          model: 'auto',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的文本扩写助手。请根据用户提供的文本，进行内容丰富、逻辑清晰的扩写。保持原意不变，增加必要的细节和说明。',
            },
            {
              role: 'user',
              content: value,
            },
          ],
          stream: true,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error('扩写请求失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let expandedText = '';

      if (!reader) return;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value: chunkValue } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(chunkValue, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;

            try {
              const json = JSON.parse(dataStr);
              const content = json?.choices?.[0]?.delta?.content;
              if (content) {
                expandedText += content;
              }
            } catch {
              // ignore
            }
          }
        }
      }

      if (expandedText) {
        onChange(expandedText);
        toast.success('扩写完成');
      } else {
        toast.error('扩写失败');
      }
    } catch (error) {
      console.error('Expand error:', error);
      toast.error('扩写失败');
    } finally {
      setIsExpanding(false);
    }
  };

  if (!enableVoice && !enableExpand) return null;

  return (
    <div className="absolute right-2 bottom-2 flex gap-1">
      {enableVoice && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="small"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={toggleRecord}
              disabled={isRecording}
            >
              <Mic className={cn('size-4', isRecording && 'text-red-500 animate-pulse')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>语音输入</TooltipContent>
        </Tooltip>
      )}
      {enableExpand && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="small"
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={handleExpand}
              disabled={isExpanding || isExpandLoading}
            >
              <Sparkles className={cn('size-4', (isExpanding || isExpandLoading) && 'animate-spin')} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>AI扩写</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

