import React, { useState } from 'react';

import { useSWRConfig } from 'swr';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAddKnowledgeBaseSegment } from '@/apis/vector';
import { ParagraphEditor } from '@/components/layout/ugc-pages/text-data/text-detail/paragraph-editor.tsx';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label.tsx';

interface IImportParagraphProps extends React.ComponentPropsWithoutRef<'div'> {
  textId: string;
  batch?: boolean;
}

export const ImportParagraph: React.FC<IImportParagraphProps> = ({ textId, children, batch = false }) => {
  const { t } = useTranslation();

  const { mutate } = useSWRConfig();
  const { trigger } = useAddKnowledgeBaseSegment(textId);

  const [delimiter, setDelimiter] = useState('\\n');
  const [visible, setVisible] = useState(false);

  const onConfirm = (paragraph: string, metadata: Record<string, unknown>) => {
    toast.promise(trigger({ text: paragraph, metadata, collectionName: textId, ...(batch ? { delimiter } : {}) }), {
      loading: t('ugc-page.text-data.detail.import.toast.import-paragraph.loading'),
      success: () => {
        setVisible(false);
        setTimeout(
          () =>
            mutate(
              (key) =>
                (typeof key === 'string' &&
                  key.startsWith(`/api/tools/monkey_tools_knowledge_base/knowledge-bases/${textId}`)) ||
                (Array.isArray(key) &&
                  key.some(
                    (k) =>
                      typeof k === 'string' &&
                      k.startsWith(`/api/tools/monkey_tools_knowledge_base/knowledge-bases/${textId}`),
                  )),
            ),
          2000,
        );
        return t('ugc-page.text-data.detail.import.toast.import-paragraph.success');
      },
      error: t('ugc-page.text-data.detail.import.toast.import-paragraph.error'),
    });
  };

  return (
    <ParagraphEditor
      visible={visible}
      setVisibility={setVisible}
      title={
        batch
          ? t('ugc-page.text-data.detail.import.paragraph.title.batch')
          : t('ugc-page.text-data.detail.import.paragraph.title.single')
      }
      extra={
        batch && (
          <div className="mt-2 flex flex-col gap-2">
            <Label>{t('ugc-page.text-data.detail.import.paragraph.extra.label')}</Label>
            <Input
              placeholder={t('ugc-page.text-data.detail.import.paragraph.extra.placeholder')}
              value={delimiter}
              onChange={setDelimiter}
            />
            <p className="text-xs text-muted-foreground">
              {t('ugc-page.text-data.detail.import.paragraph.extra.description')}
            </p>
          </div>
        )
      }
      onConfirm={onConfirm}
    >
      {children}
    </ParagraphEditor>
  );
};
