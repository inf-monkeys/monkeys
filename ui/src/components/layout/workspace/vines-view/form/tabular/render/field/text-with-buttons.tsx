import React from 'react';

import { Book } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  // 2) { [一级]: string[] }（兼容旧版，按一个“默认”二级分组呈现）
  // 3) { entries: Array<{ level1: string; level2: string; label: string }> }
  promptDictionary?: any;
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
}) => {
  const shouldShouldFormButtons = useShouldShowFormButton();
  const { t } = useTranslation();

  const [open, setOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

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

  // 归一化到 { 一级: { 二级: [三级...] } }
  const normalizedDict = React.useMemo(() => {
    const result: Record<string, Record<string, string[]>> = {};
    const d = promptDictionary;
    if (!d) return result;

    if (Array.isArray(d?.entries)) {
      for (const it of d.entries as Array<{ level1: string; level2?: string; label: string }>) {
        const l1 = it.level1 || '未分组';
        const l2 = it.level2 || '默认';
        result[l1] = result[l1] || {};
        result[l1][l2] = result[l1][l2] || [];
        result[l1][l2].push(it.label);
      }
      return result;
    }

    if (typeof d === 'object') {
      for (const [l1, sub] of Object.entries(d as Record<string, any>)) {
        if (Array.isArray(sub)) {
          result[l1] = { 默认: sub as string[] };
        } else if (typeof sub === 'object') {
          const obj: Record<string, string[]> = {};
          for (const [l2, items] of Object.entries(sub)) {
            obj[l2] = Array.isArray(items) ? (items as string[]) : [];
          }
          result[l1] = obj;
        }
      }
    }
    return result;
  }, [promptDictionary]);

  const level1Keys = React.useMemo(() => Object.keys(normalizedDict), [normalizedDict]);
  const [activeL1, setActiveL1] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!activeL1 && level1Keys.length) setActiveL1(level1Keys[0]);
  }, [level1Keys, activeL1]);

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
      {shouldShouldFormButtons && level1Keys.length > 0 && (
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
            提示词词典
          </Button>
        </div>
      )}

      {level1Keys.length > 0 && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>提示词词典</DialogTitle>
            </DialogHeader>
            <Tabs value={activeL1 ?? undefined} onValueChange={setActiveL1}>
              <TabsList>
                {level1Keys.map((k) => (
                  <TabsTrigger key={k} value={k}>
                    {k}
                  </TabsTrigger>
                ))}
              </TabsList>
              {level1Keys.map((k) => {
                const entries = Object.entries(normalizedDict[k] || {});
                const hideDefaultHeader = entries.length === 1 && entries[0][0] === '默认';
                return (
                  <TabsContent key={k} value={k}>
                    <div className="max-h-[60vh] overflow-auto pr-1">
                      {entries.map(([l2, items]) => (
                        <div key={l2} className="mb-4">
                          {!hideDefaultHeader && (
                            <div className="mb-2 text-[13px] text-muted-foreground">{l2}</div>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {(items || []).map((it) => (
                              <Button
                                key={it}
                                size="small"
                                variant="outline"
                                className="rounded-full px-3 py-1 text-sm"
                                onClick={() => insertText(it)}
                              >
                                {it}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
