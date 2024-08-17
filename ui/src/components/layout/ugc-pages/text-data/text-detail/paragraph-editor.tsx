import React, { useEffect, useState } from 'react';

import { useDebounce } from 'ahooks';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  const [value, setValue] = useState(paragraph);

  const [tempMetadata, setTempMetadata] = useState(stringify(metadata));
  const debouncedTempMetadata = useDebounce(tempMetadata, { wait: 200 });

  useEffect(() => {
    setValue(paragraph);
  }, [paragraph]);

  useEffect(() => {
    setTempMetadata(stringify(metadata));
  }, []);

  const handleOnConfirm = () => {
    try {
      const newMetadata = JSON.parse(debouncedTempMetadata);
      if (typeof newMetadata !== 'object') {
        toast.error(t('ugc-page.text-data.detail.paragraph-editor.toast.not-json'));
        return;
      }
      if (isEmpty(value)) {
        toast.error(t('ugc-page.text-data.detail.paragraph-editor.toast.empty'));
        return;
      }
      onConfirm?.(value, newMetadata);
    } catch {
      toast.error(t('ugc-page.text-data.detail.paragraph-editor.toast.not-json'));
      return;
    }
  };

  return (
    <Dialog open={visible} onOpenChange={setVisibility}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[50rem]">
        <DialogTitle>{title}</DialogTitle>
        <div className="flex flex-col gap-2">
          <Label>{t('ugc-page.text-data.detail.paragraph-editor.form.content.label')}</Label>
          <Textarea
            placeholder={t('ugc-page.text-data.detail.paragraph-editor.form.content.placeholder')}
            className="min-h-40"
            value={value}
            onChange={(v) => setValue(v.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {t('ugc-page.text-data.detail.paragraph-editor.form.content.stats', {
              count: value.length,
            })}
          </p>
          <Label>{t('ugc-page.text-data.detail.paragraph-editor.form.metadata.label')}</Label>
          <CodeEditor data={debouncedTempMetadata} onUpdate={setTempMetadata} height={200} lineNumbers={2} />
          <p className="text-xs text-muted-foreground">
            {t('ugc-page.text-data.detail.paragraph-editor.form.metadata.stats')}
          </p>
          {extra}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleOnConfirm}>
            {t('common.utils.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
