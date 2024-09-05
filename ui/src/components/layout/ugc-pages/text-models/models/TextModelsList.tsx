import React, { useRef } from 'react';

import { useCreation } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { Virtualizer } from 'virtua';

import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';

interface ITextModelsListProps {
  models?: Record<string, string>;
}

export const TextModelsList: React.FC<ITextModelsListProps> = ({ models }) => {
  const { t } = useTranslation();

  const list = useCreation(() => {
    return Object.values(models ?? {});
  }, [models]);

  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="max-h-96 w-full rounded-md border border-input">
      <h1 className="select-none p-2.5 text-sm text-muted-foreground">
        {t('ugc-page.text-models.detail.models.label')}
      </h1>
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
