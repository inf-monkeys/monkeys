import React, { useRef, useState } from 'react';

import { Book, Mic, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { vinesHeader } from '@/apis/utils.ts';
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
  minHeight = 40,
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
  
  // 监听 sidebar 宽度变化
  React.useEffect(() => {
    const handler = (e: any) => {
      const w = Number(e?.detail?.width);
      if (!Number.isNaN(w)) setSidebarWidth(w);
    };
    window.addEventListener('vines:left-sidebar-width-change', handler as any);
    return () => window.removeEventListener('vines:left-sidebar-width-change', handler as any);
  }, []);
  
  // 当 sidebar 宽度小于 280px 时，只显示图标
  const shouldShowButtonText = sidebarWidth >= 280;

  // 语音输入相关状态
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [isExpanding, setIsExpanding] = useState(false);

  const insertText = (text: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(((value ?? '') + (value ? ' ' : '') + text).trim());
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const newValue = (value ?? '').slice(0, start) + text + (value ?? '').slice(end);
    onChange(newValue);
    setTimeout(() => {
      try {
        el.focus();
        el.selectionStart = el.selectionEnd = start + text.length;
      } catch {}
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

  const applyFromSelected = (nextSelected: Record<string, boolean>, changedKey?: string) => {
    // 如果提供了改变的词，只追加这个新选中的词
    if (changedKey) {
      const wasSelected = !!selected[changedKey];
      const isNowSelected = !!nextSelected[changedKey];
      const label = labelOf(changedKey);
      
      // 如果是从未选中变成选中，追加到末尾（加逗号）
      if (!wasSelected && isNowSelected) {
        const currentValue = (value ?? '').trim();
        const separator = currentValue ? ', ' : '';
        onChange(currentValue + separator + label);
        return;
      }
      
      // 如果是从选中变成未选中，从输入框中删除这个词
      if (wasSelected && !isNowSelected) {
        const currentValue = (value ?? '').trim();
        if (!currentValue) return;
        
        // 使用正则表达式精确匹配并删除这个词（考虑各种分隔符）
        const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // 优先匹配 ",\s*词" 或 "词," 模式，这样可以保留一个逗号
        let newValue = currentValue;
        
        // 处理开头的情况："词," -> 直接删除
        newValue = newValue.replace(new RegExp(`^${escapedLabel}\\s*,?\\s*`, 'g'), '');
        
        // 处理结尾的情况：", 词" -> 删除逗号和词
        newValue = newValue.replace(new RegExp(`,\\s*${escapedLabel}\\s*$`, 'g'), '');
        
        // 处理中间的情况：", 词," -> 保留一个逗号
        newValue = newValue.replace(new RegExp(`,\\s*${escapedLabel}\\s*,`, 'g'), ',');
        
        // 清理多余的逗号和空格
        newValue = newValue.replace(/\s*,\s*,\s*/g, ', ').replace(/^,|,$/g, '').trim();
        
        onChange(newValue);
        return;
      }
    }
    
    // 如果没有提供 changedKey，保持原有逻辑（用于其他场景）
    const chosen = Object.entries(nextSelected)
      .filter(([, on]) => on)
      .map(([k]) => labelOf(k));
    // 用空格拼接并去重（以插入顺序为准）
    const uniq: string[] = [];
    for (const s of chosen) if (!uniq.includes(s)) uniq.push(s);
    onChange((uniq || []).join(' '));
  };

  // 归一化到 { 一级: { 二级: { 三级: [{label: string, level4?: string, description?: string}] } } }
  const normalizedDict = React.useMemo(() => {
    const result: Record<string, Record<string, Record<string, Array<{ label: string; level4?: string; description?: string }>>>> = {};
    const d = promptDictionary;
    if (!d) return result;

    if (Array.isArray(d?.entries)) {
      for (const it of d.entries as Array<{ level1: string; level2?: string; level3?: string; level4?: string; label: string; description?: string }>) {
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
          const obj: Record<string, Record<string, Array<{ label: string; level4?: string; description?: string }>>> = {};
          const subKeys = Object.keys(sub);
          for (const l2 of subKeys) {
            const items = sub[l2];
            obj[l2] = { 默认: Array.isArray(items)
              ? items.map((item: any) => {
                  if (typeof item === 'string') {
                    return { label: item };
                  }
                  return { label: item.label || item, description: item.description };
                })
              : [] };
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

  return (
    <div className="relative p-1">
      <textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'flex h-[180px] w-full resize-none rounded-md border border-input bg-[#FFFFFF] px-3 py-2 pr-global text-sm text-gray-500 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#111113]',
          className,
        )}
        style={{ height: '180px' }}
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
                      (isExpanding) && 'animate-spin',
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleExpand();
                    }}
                    disabled={isExpanding}
                  >
                     <Sparkles className="h-4 w-4 text-gray-800 dark:text-white" />
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
          <DialogContent className="max-w-3xl" hideOverlay>
            <DialogHeader>
              <DialogTitle>{t('workspace.pre-view.actuator.execution-form.knowledge-graph.title')}</DialogTitle>
            </DialogHeader>
            <TooltipProvider>
              <Tabs value={activeL1 ?? undefined} onValueChange={setActiveL1}>
                <TabsList>
                  {level1Keys.map((k) => (
                    <TabsTrigger key={k} value={k}>
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
                          l3Keys.forEach(l3 => {
                            const items = l3Dict[l3];
                            const hasL4 = (items || []).some(it => it.level4);
                            if (hasL4) {
                              l3WithL4.push(l3);
                            } else {
                              l3WithoutL4.push(l3);
                            }
                          });
                          
                          return (
                            <div key={l2} className="mb-4">
                              {!hideL2Header && <div className="mb-2 text-base font-medium text-muted-foreground">{l2}</div>}
                              
                              {/* 先渲染所有没有 level4 的 L3 按钮在同一排 */}
                              {l3WithoutL4.length > 0 && (
                                <div className="mb-3">
                                  <div className="flex flex-wrap gap-2">
                                    {l3WithoutL4.map((l3) => {
                                      const k = keyOf(k2, l2, l3, '');
                                      const isSelected = currentValue.includes(l3);
                                      
                                      // 获取 description
                                      const items = l3Dict[l3];
                                      const item = (items || []).find(it => !it.level4);
                                      const description = item?.description;
                                      
                                      const toggleButton = (
                                        <Toggle
                                          key={k}
                                          pressed={isSelected}
                                          onPressedChange={(v) => {
                                            applyFromSelected({ ...selected, [k]: v }, k);
                                          }}
                                          className={cn(
                                            "rounded-full border px-3 py-1 text-sm",
                                            isSelected 
                                              ? "bg-vines-500 text-white border-vines-500" 
                                              : "bg-transparent hover:bg-muted"
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
                                
                                const itemsWithL4 = (items || []).filter(it => it.level4);
                                
                                return (
                                  <div key={l3} className="mb-3">
                                    {/* 显示 level4 的标题 */}
                                    {!hideL3Header && <div className="mb-2 text-[13px] text-muted-foreground">{l3}</div>}
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
                                            onPressedChange={(v) => {
                                              applyFromSelected({ ...selected, [k]: v }, k);
                                            }}
                                            className={cn(
                                              "rounded-full border px-3 py-1 text-sm",
                                              isSelected 
                                                ? "bg-vines-500 text-white border-vines-500" 
                                                : "bg-transparent hover:bg-muted"
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
