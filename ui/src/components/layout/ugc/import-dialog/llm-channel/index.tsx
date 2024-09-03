import React, { useCallback, useMemo, useState } from 'react';

import { useEventEmitter } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createLLMChannel } from '@/apis/llm';
import { ILLMChannel } from '@/apis/llm/typings';
import { calculateDisplayInputs } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/utils.ts';
import { TabularRender, TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getI18nContent } from '@/utils';

interface IUgcImportDialogProps {
  children?: React.ReactNode;
  channel?: ILLMChannel;
  afterOperate?: () => void;
}

export const LLMChannelImportDialog: React.FC<IUgcImportDialogProps> = ({ children, channel, afterOperate }) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  const finalInputs = useMemo(() => {
    return calculateDisplayInputs(channel?.properites ?? [], {});
  }, [channel?.properites]);

  const handleImport = useCallback(
    (data: any) => {
      if (!channel) {
        return;
      }

      if (channel.properites.some((it) => it.required && !data[it.name])) {
        toast.error(t('common.utils.fill-required'));
        return;
      }

      const { id } = channel;
      toast.promise(createLLMChannel(id, data), {
        success: () => {
          afterOperate?.();
          setOpen(false);
          return t('common.operate.success');
        },
        error: t('common.operate.error'),
        loading: t('common.operate.loading'),
      });
    },
    [channel, finalInputs],
  );

  const tabular$ = useEventEmitter<TTabularEvent>();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getI18nContent(channel?.displayName)}</DialogTitle>
        </DialogHeader>
        <TabularRender
          inputs={finalInputs}
          height={400}
          onSubmit={handleImport}
          event$={tabular$}
          miniMode
          extra={{ modelId: Number(channel?.id ?? '') }}
        >
          <Button className="mb-1 min-h-10" variant="outline" type="submit" onClick={() => tabular$.emit('submit')}>
            {t('common.utils.confirm')}
          </Button>
        </TabularRender>
      </DialogContent>
    </Dialog>
  );
};
