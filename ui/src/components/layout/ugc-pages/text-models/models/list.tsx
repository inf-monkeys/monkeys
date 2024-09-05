import React, { useRef } from 'react';

import { useCreation } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { Virtualizer } from 'virtua';

import {
  IModelSupplierEditorProps,
  ModelSupplierEditor,
} from '@/components/layout/ugc-pages/text-models/models/model-supplier-editor';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';

interface ITextModelsListProps extends IModelSupplierEditorProps {
  models?: Record<string, string>;
}

export const TextModelsList: React.FC<ITextModelsListProps> = ({
  models,
  properites,
  modelType,
  afterOperate,
  modelId,
}) => {
  const { t } = useTranslation();

  const list = useCreation(() => {
    return Object.values(models ?? {});
  }, [models]);

  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="max-h-96 w-full rounded-md border border-input">
      <div className="flex items-center justify-between p-2.5">
        <h1 className="select-none text-sm text-muted-foreground">{t('ugc-page.text-models.detail.models.label')}</h1>
        <ModelSupplierEditor
          properites={properites}
          modelType={modelType}
          afterOperate={afterOperate}
          modelId={modelId}
        />
      </div>
      <Separator />
      <ScrollArea className="-mr-1 w-full pr-1" ref={scrollRef} style={{ height: 260 }} disabledOverflowMask>
        <Virtualizer scrollRef={scrollRef}>
          {list.map((model, i) => (
            <div className="border-b border-input p-2.5 text-sm" key={i}>
              {model}
            </div>
          ))}
        </Virtualizer>
      </ScrollArea>
    </div>
  );
};
