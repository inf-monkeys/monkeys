import React, { useRef, useState } from 'react';

import { Mic, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

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
      // 调用后端代理接口进行扩写（服务端持有 API Key）
      const response = await fetch('/api/text-expansion/expand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          text: value,
        }),
      });

      if (!response.ok) {
        throw new Error('扩写请求失败');
      }

      const data = await response.json();

      // 尝试从不同可能的响应结构中提取扩写结果
      let expandedText = '';

      // 首先尝试遍历所有字段，查找output相关的字段（如output1, output2等）
      for (const key in data) {
        if (key.startsWith('output')) {
          const value = data[key];
          if (typeof value === 'string' && value.trim()) {
            expandedText = value;
            break;
          }
        }
      }

      // 如果有output字段，尝试提取
      if (!expandedText && data?.output) {
        // 如果是数组，尝试从第一个元素获取text或content字段
        if (Array.isArray(data.output) && data.output[0]) {
          const firstOutput = data.output[0];
          expandedText = firstOutput.text || firstOutput.content || firstOutput.data || firstOutput.value || '';
        }
        // 如果是对象，尝试直接获取text或content字段
        else if (typeof data.output === 'object') {
          expandedText =
            data.output.text ||
            data.output.content ||
            data.output.data ||
            data.output.value ||
            data.output.result ||
            data.output.message ||
            '';
        }
        // 如果是字符串，直接使用
        else if (typeof data.output === 'string') {
          expandedText = data.output;
        }
      }

      // 如果没有从output中获取到，尝试从根级别的字段获取
      if (!expandedText) {
        expandedText = data.text || data.content || data.data || data.result || data.message || '';
      }

      // 如果仍然没有，尝试从rawOutput中获取
      if (!expandedText && data?.rawOutput) {
        if (Array.isArray(data.rawOutput) && data.rawOutput[0]) {
          const firstOutput = data.rawOutput[0];
          expandedText = firstOutput.text || firstOutput.content || firstOutput.data || '';
        } else if (typeof data.rawOutput === 'object') {
          expandedText = data.rawOutput.text || data.rawOutput.content || data.rawOutput.data || '';
        } else if (typeof data.rawOutput === 'string') {
          expandedText = data.rawOutput;
        }
      }

      if (expandedText && expandedText.trim()) {
        onChange(expandedText);
        toast.success('扩写完成');
      } else {
        console.error('扩写响应结构:', data);
        toast.error('扩写失败：无法从响应中提取结果');
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
    <div className="absolute bottom-2 right-2 flex gap-1">
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
              <Mic className={cn('size-4', isRecording && 'animate-pulse text-red-500')} />
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
