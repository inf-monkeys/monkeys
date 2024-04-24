import React, { useEffect, useState } from 'react';

import { useDebouncedState } from '@mantine/hooks';
import { isEmpty } from 'lodash';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/ui/code-editor';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { stringify } from '@/utils/fast-stable-stringify.ts';

interface IImportParagraphProps {
  visible?: boolean;
  setVisibility?: (v: boolean) => void;
  title?: string;
  children: React.ReactNode;
  paragraph?: string;
  metadata?: Record<string, unknown>;
  onConfirm?: (paragraph: string, metadata: Record<string, unknown>) => void;
  extra?: React.ReactNode;
}

export const ParagraphEditor: React.FC<IImportParagraphProps> = ({
  visible,
  setVisibility,
  title = '',
  paragraph = '',
  metadata = {},
  children,
  onConfirm,
  extra,
}) => {
  const [value, setValue] = useState(paragraph);
  const [tempMetadata, setTempMetadata] = useDebouncedState(stringify(metadata), 200);

  useEffect(() => {
    setValue(paragraph);
  }, [paragraph]);

  useEffect(() => {
    setTempMetadata(stringify(metadata));
  }, []);

  const handleOnConfirm = () => {
    try {
      const newMetadata = JSON.parse(tempMetadata);
      if (typeof newMetadata !== 'object') {
        toast.error('元数据必须为 JSON');
        return;
      }
      if (isEmpty(value)) {
        toast.error('段落内容不能为空');
        return;
      }
      onConfirm?.(value, newMetadata);
    } catch {
      toast.error('元数据必须为 JSON');
      return;
    }
  };

  return (
    <Dialog open={visible} onOpenChange={setVisibility}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[50rem]">
        <DialogTitle>{title}</DialogTitle>
        <div className="flex flex-col gap-2">
          <Label>段落内容</Label>
          <Textarea
            placeholder="请在此键入段落"
            className="min-h-40"
            value={value}
            onChange={(v) => setValue(v.target.value)}
          />
          <p className="text-xs text-muted-foreground">共计 {value.length} 个字符</p>
          <Label>段落元数据</Label>
          <CodeEditor data={tempMetadata} onUpdate={setTempMetadata} height={200} lineNumbers={2} />
          <p className="text-xs text-muted-foreground">为此段落设置任意元数据，可通过元数据对段落进行过滤</p>
          {extra}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleOnConfirm}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
