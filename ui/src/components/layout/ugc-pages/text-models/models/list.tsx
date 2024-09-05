import React, { useRef } from 'react';

import { useCreation, useMemoizedFn } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Virtualizer } from 'virtua';

import { useLLMChannelTest } from '@/apis/llm';
import {
  IModelSupplierEditorProps,
  ModelSupplierEditor,
} from '@/components/layout/ugc-pages/text-models/models/model-supplier-editor';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';

interface ITextModelsListProps extends IModelSupplierEditorProps {
  models?: Record<string, string>;
}

export const TextModelsList: React.FC<ITextModelsListProps> = ({ models, modelType, ...rest }) => {
  const { t } = useTranslation();

  const list = useCreation(() => {
    return Object.values(models ?? {});
  }, [models]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const { trigger } = useLLMChannelTest(modelType);
  const handleTest = useMemoizedFn(async (modelId: string) => {
    if (!modelId) return;
    toast.promise(trigger({ modelId }), {
      success: (it) => {
        const timeConsuming = it?.time
          ? t('ugc-page.text-models.detail.models.time-consuming.context', { time: it.time })
          : null;
        return it?.message || timeConsuming || t('ugc-page.text-models.detail.models.time-consuming.success');
      },
      loading: t('ugc-page.text-models.detail.models.time-consuming.loading'),
      error: t('ugc-page.text-models.detail.models.time-consuming.error'),
    });
  });

  return (
    <div className="col-span-2 max-h-96 w-full rounded-md border border-input">
      <div className="flex items-center justify-between p-2.5">
        <h1 className="select-none text-sm text-muted-foreground">{t('ugc-page.text-models.detail.models.label')}</h1>
        <ModelSupplierEditor modelType={modelType} {...rest} />
      </div>
      <Separator />
      <ScrollArea className="-mr-1 w-full pr-1" ref={scrollRef} style={{ height: 260 }} disabledOverflowMask>
        <Virtualizer scrollRef={scrollRef}>
          {list.map((modelId, i) => (
            <div className="flex items-center justify-between border-b border-input p-2.5 text-sm" key={i}>
              {modelId}
              <Button className="-my-2 -mr-2 !h-7" variant="outline" size="small" onClick={() => handleTest(modelId)}>
                {t('ugc-page.text-models.detail.models.test')}
              </Button>
            </div>
          ))}
        </Virtualizer>
      </ScrollArea>
    </div>
  );
};
