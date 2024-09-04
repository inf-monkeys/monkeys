import React, { useRef, useState } from 'react';

import { mutate } from 'swr';

import { useCreation } from 'ahooks';
import { Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Virtualizer } from 'virtua';

import { ILLMChannel } from '@/apis/llm/typings.ts';
import { useUgcTextModelStore } from '@/apis/ugc';
import { LLMChannelImportForm } from '@/components/layout/ugc-pages/text-models/model-supplier/import-form.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesImage } from '@/components/ui/image';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, getI18nContent } from '@/utils';

interface IModelSupplierProps {}

export const ModelSupplier: React.FC<IModelSupplierProps> = () => {
  const { t } = useTranslation();

  const { data } = useUgcTextModelStore({ page: 1, limit: 9999 });

  const [channel, setChannel] = useState<ILLMChannel>();
  const suppliers = useCreation(() => {
    if (!channel) {
      setChannel(data?.data?.find(({ id }) => id === '1'));
    }
    return data?.data?.sort((a, b) => Number(a.id) - Number(b.id)) ?? [];
  }, [data?.data]);

  const [open, setOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button icon={<Package />} variant="outline" size="small">
          {t('ugc-page.text-models.ugc-view.import-channel.label')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('ugc-page.text-models.ugc-view.import-channel.label')}</DialogTitle>
        </DialogHeader>
        <div className="flex w-full justify-between">
          <ScrollArea className="mr-0.5 w-full pr-2.5" ref={scrollRef} style={{ height: 500 }} disabledOverflowMask>
            <Virtualizer scrollRef={scrollRef}>
              {suppliers.map((it, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <Card
                      className={cn(
                        'outline-3 m-1 mb-2 cursor-pointer outline outline-transparent transition-colors hover:bg-muted active:bg-muted',
                        it.id === channel?.id && 'bg-muted outline-vines-500',
                      )}
                      onClick={() => setChannel(it)}
                    >
                      <CardHeader className="!flex-row items-center gap-2 p-4">
                        <VinesImage src={it.iconUrl} className="!size-8" />
                        <CardTitle className="!mt-0 select-none text-base">{getI18nContent(it.displayName)}</CardTitle>
                      </CardHeader>
                      <CardContent className="select-none p-4 pt-0 text-xs">
                        {getI18nContent(it.description)}
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('ugc-page.text-models.ugc-view.import-channel.select-channel-tip')}
                  </TooltipContent>
                </Tooltip>
              ))}
            </Virtualizer>
          </ScrollArea>
          <Separator orientation="vertical" className="h-full" />
          <div
            className="ml-4 w-full space-y-4"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <h1 className="font-bold">{getI18nContent(channel?.displayName)}</h1>
            <LLMChannelImportForm
              channel={channel}
              afterOperate={() => {
                setOpen(false);
                void mutate((key) => typeof key === 'string' && key.startsWith('/api/llm-models'));
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
