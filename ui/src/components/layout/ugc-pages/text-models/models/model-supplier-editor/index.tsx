import React, { useState } from 'react';

import { ToolProperty } from '@inf-monkeys/monkeys';
import { useCreation, useEventEmitter, useMemoizedFn } from 'ahooks';
import { isEmpty, set } from 'lodash';
import { Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateLLMChannel } from '@/apis/llm';
import { calculateDisplayInputs } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/utils.ts';
import { TabularRender, TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export interface IModelSupplierEditorProps {
  modelId: string;
  modelType?: string;
  properites: ToolProperty[];
  afterOperate?: () => void;
}

export const ModelSupplierEditor: React.FC<IModelSupplierEditorProps> = ({
  modelId,
  properites,
  modelType,
  afterOperate,
}) => {
  const { t } = useTranslation();

  const finalInputs = useCreation(() => {
    return calculateDisplayInputs(properites ?? [], {});
  }, [properites]);

  const tabular$ = useEventEmitter<TTabularEvent>();

  const [open, setOpen] = useState(false);

  const handleImport = useMemoizedFn((data: any) => {
    if (!modelType) {
      return;
    }

    if (properites.some((it) => it.required && isEmpty(data[it.name]))) {
      toast.error(t('common.utils.fill-required'));
      return;
    }

    set(data, 'id', modelId);

    toast.promise(updateLLMChannel(modelType, data), {
      success: () => {
        setOpen(false);
        afterOperate?.();
        return t('common.operate.success');
      },
      error: t('common.operate.error'),
      loading: t('common.operate.loading'),
    });
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="-my-2 -mr-1 !h-7" variant="outline" size="small" icon={<Package />}>
          {t('ugc-page.text-models.detail.edit-model-supplier.label')}
        </Button>
      </DialogTrigger>
      <DialogContent
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('ugc-page.text-models.detail.edit-model-supplier.label')}</DialogTitle>
        </DialogHeader>
        <TabularRender
          inputs={finalInputs}
          height={404}
          onSubmit={handleImport}
          miniMode
          extra={{ modelId: Number(modelType ?? '') }}
          event$={tabular$}
        >
          <Button
            className="mx-3 min-h-10 w-[calc(100%-1.5rem)]"
            variant="outline"
            type="submit"
            onClick={() => tabular$.emit('submit')}
          >
            {t('common.utils.save')}
          </Button>
        </TabularRender>
      </DialogContent>
    </Dialog>
  );
};
