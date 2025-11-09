import React, { useRef, useState } from 'react';

import { Book, Mic, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useShouldShowFormButton } from '@/store/useShouldShowFormButton';
import { cn } from '@/utils';

interface TextWithButtonsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  onSmartOptimize?: () => void;
  onShowDictionary?: () => void;
  // 支持两种形态：
  // 1) { [一级]: { [二级]: string[] } }
  // 2) { [一级]: string[] }（兼容旧版，按一个"默认"二级分组呈现）
  // 3) { entries: Array<{ level1: string; level2: string; label: string }> }
  promptDictionary?: any;
  enableVoice?: boolean;
  enableExpand?: boolean;
  voiceButtonText?: string;
  expandButtonText?: string;
  knowledgeGraphButtonText?: string;
}

export const TextWithButtons: React.FC<TextWithButtonsProps> = ({
  value,
  onChange,
  placeholder,
  minHeight = 180,
  maxHeight = 200,
  className,
  onSmartOptimize,
  onShowDictionary,
  promptDictionary,
  enableVoice,
  enableExpand,
  voiceButtonText,
  expandButtonText,
  knowledgeGraphButtonText,
}) => {
  const shouldShouldFormButtons = useShouldShowFormButton();
  const { t } = useTranslation();

  const [open, setOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [sidebarWidth, setSidebarWidth] = React.useState<number>(300);

  // 拖动相关状态
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef({ x: 0, y: 0 });
  const dragStartPositionRef = React.useRef({ x: 0, y: 0 });
  const dialogRef = React.useRef<HTMLDivElement | null>(null);

  // 监听 sidebar 宽度变化
  React.useEffect(() => {
    const handler = (e: any) => {
      const w = Number(e?.detail?.width);
      if (!Number.isNaN(w)) setSidebarWidth(w);
    };
    window.addEventListener('vines:left-sidebar-width-change', handler as any);
    return () => window.removeEventListener('vines:left-sidebar-width-change', handler as any);
  }, []);

  // 拖动处理函数
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // 只处理左键

    // 记录拖拽开始时的鼠标位置和对话框位置（使用 ref 确保立即生效）
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    dragStartPositionRef.current = { x: position.x, y: position.y };
    setIsDragging(true);
    e.preventDefault();
  };

  // 全局鼠标移动处理
  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // 计算鼠标移动的距离（使用 ref 确保获取正确的起始值）
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      // 更新位置：初始位置 + 移动距离
      setPosition({
        x: dragStartPositionRef.current.x + deltaX,
        y: dragStartPositionRef.current.y + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // 重置位置当对话框关闭时
  React.useEffect(() => {
    if (!open) {
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  // 当 sidebar 宽度小于 280px 时，只显示图标
  const shouldShowButtonText = sidebarWidth >= 280;

  // 语音输入相关状态
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isExpanding, setIsExpanding] = useState(false);

  const insertText = (text: string) => {
    const el = textareaRef.current;
    const current = value ?? '';
    const leftClean = current.replace(/[\s,]+$/g, '');
    const newValue = leftClean ? `${leftClean}, ${text}` : `${text}`;
    onChange(newValue);
    setTimeout(() => {
      try {
        if (el && document.activeElement === el) {
          el.selectionStart = el.selectionEnd = newValue.length;
        }
      } catch {
        /* empty */
      }
    }, 0);
  };

  const keyOf = (l1: string, l2: string, label: string, level4?: string) => {
    const l4 = level4 || '';
    return `${l1}|||${l2}|||${label}${l4 ? `|||${l4}` : ''}`;
  };
  const labelOf = (key: string) => {
    const parts = key.split('|||');
    // 如果有 level4，返回 level4；否则返回 label（在第三个位置）
    return parts.length >= 4 ? parts[3] : parts[2] || '';
  };

  const applyFromSelected = (label: string) => {
    const currentValue = (value ?? '').trim();

    // 检查是否已经包含这个词
    if (currentValue.includes(label)) {
      // 已包含，删除它
      const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let newValue = currentValue;

      // 处理开头："词," 或 "词 " -> 删除
      newValue = newValue.replace(new RegExp(`^${escapedLabel}\\s*,?\\s*`, 'g'), '');

      // 处理结尾：", 词" 或 " 词" -> 删除
      newValue = newValue.replace(new RegExp(`[,\\s]*${escapedLabel}\\s*$`, 'g'), '');

      // 处理中间：", 词," 或 " 词 " -> 保留一个逗号
      newValue = newValue.replace(new RegExp(`[,\\s]*${escapedLabel}[,\\s]*`, 'g'), ', ');

      // 清理多余的逗号和空格
      newValue = newValue
        .replace(/\s*,\s*,\s*/g, ', ')
        .replace(/^[,\s]+|[,\s]+$/g, '')
        .trim();

      onChange(newValue);

      // 删除后，将光标移动到末尾（不强制聚焦，避免关闭对话框）
      setTimeout(() => {
        const el = textareaRef.current;
        if (el && document.activeElement === el) {
          // 只有当 textarea 已经是焦点时才设置光标位置
          el.selectionStart = el.selectionEnd = newValue.length;
        }
      }, 0);
    } else {
      // 不包含，添加它
      insertText(label);
    }
  };

  // 归一化到 { 一级: { 二级: { 三级: [{label: string, level4?: string, description?: string}] } } }
  const normalizedDict = React.useMemo(() => {
    const result: Record<
      string,
      Record<string, Record<string, Array<{ label: string; level4?: string; description?: string }>>>
    > = {};
    const d = promptDictionary;
    if (!d) return result;

    if (Array.isArray(d?.entries)) {
      for (const it of d.entries as Array<{
        level1: string;
        level2?: string;
        level3?: string;
        level4?: string;
        label: string;
        description?: string;
      }>) {
        const l1 = it.level1 || '未分组';
        const l2 = it.level2 || '默认';
        const l3 = it.level3 || '默认';
        result[l1] = result[l1] || {};
        result[l1][l2] = result[l1][l2] || {};
        result[l1][l2][l3] = result[l1][l2][l3] || [];
        result[l1][l2][l3].push({ label: it.label, level4: it.level4, description: it.description });
      }
      return result;
    }

    if (typeof d === 'object') {
      // 使用 Object.keys() 保持顺序，然后遍历
      const keys = Object.keys(d as Record<string, any>);
      for (const l1 of keys) {
        const sub = (d as Record<string, any>)[l1];
        if (Array.isArray(sub)) {
          // 处理数组，可能是字符串数组或对象数组
          const items = sub.map((item) => {
            if (typeof item === 'string') {
              return { label: item };
            }
            return { label: item.label || item, description: item.description };
          });
          result[l1] = { 默认: { 默认: items } };
        } else if (typeof sub === 'object') {
          const obj: Record<
            string,
            Record<string, Array<{ label: string; level4?: string; description?: string }>>
          > = {};
          const subKeys = Object.keys(sub);
          for (const l2 of subKeys) {
            const items = sub[l2];
            obj[l2] = {
              默认: Array.isArray(items)
                ? items.map((item: any) => {
                    if (typeof item === 'string') {
                      return { label: item };
                    }
                    return { label: item.label || item, description: item.description };
                  })
                : [],
            };
          }
          result[l1] = obj;
        }
      }
    }
    return result;
  }, [promptDictionary]);

  const level1Keys = React.useMemo(() => {
    const keys = Object.keys(normalizedDict);
    // 确保顺序一致：按照 JSON 中定义的顺序
    return keys;
  }, [normalizedDict]);
  const [activeL1, setActiveL1] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!activeL1 && level1Keys.length) setActiveL1(level1Keys[0]);
  }, [level1Keys, activeL1]);

  // 同步 selected 状态和输入框内容
  React.useEffect(() => {
    const currentValue = (value ?? '').trim();
    if (currentValue && level1Keys.length > 0) {
      const updatedSelected: Record<string, boolean> = {};

      // 遍历所有词，检查输入框是否包含（支持四级标签）
      Object.entries(normalizedDict).forEach(([l1, l2Dict]) => {
        Object.entries(l2Dict).forEach(([l2, l3Dict]) => {
          Object.entries(l3Dict).forEach(([l3, items]) => {
            items.forEach((item) => {
              const displayLabel = item.level4 || item.label;
              const k = keyOf(l1, l2, item.label, item.level4);
              updatedSelected[k] = currentValue.includes(displayLabel);
            });
          });
        });
      });

      setSelected(updatedSelected);
    }
  }, [value, level1Keys, normalizedDict]);

  // 语音输入处理函数
  const toggleRecord = async () => {
    if (isRecording) {
      try {
        mediaRecorderRef.current?.stop();
      } catch {}
      setIsRecording(false);
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
    } catch (error) {
      toast.error('无法访问麦克风');
      setIsRecording(false);
    }
  };

  // 扩写处理函数
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

  return (
    <div className="relative p-1">
      <textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'flex w-full resize-none rounded-md border border-input bg-[#FFFFFF] px-3 py-2 pr-global text-sm text-gray-500 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#111113]',
          className,
        )}
        style={{ height: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
      />
      {shouldShouldFormButtons && (level1Keys.length > 0 || enableVoice || enableExpand) && (
        <div className="absolute bottom-4 left-4 flex gap-2">
          {/* <Button
            variant="outline"
            size="small"
            className="vines-button flex select-none items-center justify-center gap-1 whitespace-nowrap rounded-md border border-input bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm ring-offset-background transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-[#1E1E1E] dark:text-white dark:hover:bg-[#2D2D2D] dark:hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onSmartOptimize?.();
            }}
          >
            <RefreshCcw className="h-4 w-4 text-gray-800 dark:text-white" />
            智能优化
          </Button> */}
          {enableVoice && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="small"
                    className={cn(
                      'vines-button flex select-none items-center justify-center gap-1 whitespace-nowrap rounded-md border border-input bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm ring-offset-background transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-[#1E1E1E] dark:text-white dark:hover:bg-[#2D2D2D] dark:hover:text-white',
                      isRecording && 'animate-pulse bg-red-100 dark:bg-red-900',
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      toggleRecord();
                    }}
                  >
                    <Mic className="h-4 w-4 text-gray-800 dark:text-white" />
                    {shouldShowButtonText && voiceButtonText}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>语音输入</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {enableExpand && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="small"
                    className={cn(
                      'vines-button flex select-none items-center justify-center gap-1 whitespace-nowrap rounded-md border border-input bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm ring-offset-background transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-[#1E1E1E] dark:text-white dark:hover:bg-[#2D2D2D] dark:hover:text-white',
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleExpand();
                    }}
                    disabled={isExpanding}
                  >
                    <Sparkles className={cn('h-4 w-4 text-gray-800 dark:text-white', isExpanding && 'animate-spin')} />
                    {shouldShowButtonText && expandButtonText}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>AI扩写</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {level1Keys.length > 0 && (
            <Button
              variant="outline"
              size="small"
              className="vines-button flex select-none items-center justify-center gap-1 whitespace-nowrap rounded-md border border-input bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm ring-offset-background transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-[#1E1E1E] dark:text-white dark:hover:bg-[#2D2D2D] dark:hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onShowDictionary?.();
                setOpen(true);
              }}
            >
              <Book className="h-4 w-4 text-gray-800 dark:text-white" />
              {shouldShowButtonText && knowledgeGraphButtonText}
            </Button>
          )}
        </div>
      )}

      {level1Keys.length > 0 && (
        <Dialog open={open} onOpenChange={setOpen} modal={false}>
          <DialogContent
            className="max-w-3xl"
            hideOverlay
            style={{ transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))` }}
          >
            <DialogHeader className="cursor-move select-none border-b pb-3" onMouseDown={handleMouseDown}>
              <DialogTitle>{t('workspace.pre-view.actuator.execution-form.knowledge-graph.title')}</DialogTitle>
            </DialogHeader>
            <TooltipProvider>
              <Tabs value={activeL1 ?? undefined} onValueChange={setActiveL1}>
                <TabsList className="flex-wrap gap-2 overflow-x-auto">
                  {level1Keys.map((k) => (
                    <TabsTrigger key={k} value={k} className="flex-shrink-0 !w-auto">
                      {k}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {level1Keys.map((k2) => {
                  const l2Dict = normalizedDict[k2] || {};
                  const l2Keys = Object.keys(l2Dict);
                  return (
                    <TabsContent key={k2} value={k2}>
                      <div className="max-h-[60vh] overflow-auto pr-1">
                        {l2Keys.map((l2) => {
                          const l3Dict = l2Dict[l2];
                          const l3Keys = Object.keys(l3Dict);
                          const hideL2Header = l2Keys.length === 1 && l2Keys[0] === '默认';
                          const currentValue = (value ?? '').trim();

                          // 分离有 level4 和没有 level4 的 l3
                          const l3WithL4: string[] = [];
                          const l3WithoutL4: string[] = [];
                          l3Keys.forEach((l3) => {
                            const items = l3Dict[l3];
                            const hasL4 = (items || []).some((it) => it.level4);
                            if (hasL4) {
                              l3WithL4.push(l3);
                            } else {
                              l3WithoutL4.push(l3);
                            }
                          });

                          return (
                            <div key={l2} className="mb-4">
                              {!hideL2Header && (
                                <div className="mb-2 text-base font-medium text-muted-foreground">{l2}</div>
                              )}

                              {/* 先渲染所有没有 level4 的 L3 按钮在同一排 */}
                              {l3WithoutL4.length > 0 && (
                                <div className="mb-3">
                                  <div className="flex flex-wrap gap-2">
                                    {l3WithoutL4.map((l3) => {
                                      const k = keyOf(k2, l2, l3, '');
                                      const isSelected = currentValue.includes(l3);

                                      // 获取 description
                                      const items = l3Dict[l3];
                                      const item = (items || []).find((it) => !it.level4);
                                      const description = item?.description;

                                      const toggleButton = (
                                        <Toggle
                                          key={k}
                                          pressed={isSelected}
                                          onPressedChange={() => {
                                            applyFromSelected(l3);
                                          }}
                                          className={cn(
                                            'rounded-full border px-3 py-1 text-sm',
                                            isSelected
                                              ? 'border-vines-500 bg-vines-500 text-white'
                                              : 'bg-transparent hover:bg-muted',
                                          )}
                                        >
                                          {l3}
                                        </Toggle>
                                      );

                                      // 如果有描述，则用 Tooltip 包裹
                                      if (description) {
                                        return (
                                          <Tooltip key={k}>
                                            <TooltipTrigger asChild>{toggleButton}</TooltipTrigger>
                                            <TooltipContent className="max-w-xs">
                                              <p className="text-xs">{description}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        );
                                      }

                                      return toggleButton;
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* 再渲染有 level4 的 L3 */}
                              {l3WithL4.map((l3) => {
                                const items = l3Dict[l3];
                                const hideL3Header = l3Keys.length === 1 && l3Keys[0] === '默认';

                                const itemsWithL4 = (items || []).filter((it) => it.level4);

                                return (
                                  <div key={l3} className="mb-3">
                                    {/* 显示 level4 的标题 */}
                                    {!hideL3Header && (
                                      <div className="mb-2 text-[13px] text-muted-foreground">{l3}</div>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                      {/* 显示 level4 按钮 */}
                                      {itemsWithL4.map((it, idx) => {
                                        const displayLabel = it.level4 || '';
                                        const k = keyOf(k2, l2, it.label, it.level4);
                                        const isSelected = currentValue.includes(displayLabel);
                                        const toggleButton = (
                                          <Toggle
                                            key={k}
                                            pressed={isSelected}
                                            onPressedChange={() => {
                                              applyFromSelected(displayLabel);
                                            }}
                                            className={cn(
                                              'rounded-full border px-3 py-1 text-sm',
                                              isSelected
                                                ? 'border-vines-500 bg-vines-500 text-white'
                                                : 'bg-transparent hover:bg-muted',
                                            )}
                                          >
                                            {displayLabel}
                                          </Toggle>
                                        );

                                        // 如果有描述，则用 Tooltip 包裹
                                        if (it.description) {
                                          return (
                                            <Tooltip key={k}>
                                              <TooltipTrigger asChild>{toggleButton}</TooltipTrigger>
                                              <TooltipContent className="max-w-xs">
                                                <p className="text-xs">{it.description}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          );
                                        }

                                        return toggleButton;
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </TabsContent>
                  );
                })}
              </Tabs>
            </TooltipProvider>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
