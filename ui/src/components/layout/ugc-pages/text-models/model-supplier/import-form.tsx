import React, { useCallback, useMemo } from 'react';

import { useEventEmitter } from 'ahooks';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createLLMChannel } from '@/apis/llm';
import { ILLMChannel } from '@/apis/llm/typings.ts';
import { calculateDisplayInputs } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/utils.ts';
import { TabularRender, TTabularEvent } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';

interface ILLMChannelImportFormProps {
  channel?: ILLMChannel;
  afterOperate?: () => void;
}

export const LLMChannelImportForm: React.FC<ILLMChannelImportFormProps> = ({ channel, afterOperate }) => {
  const { t } = useTranslation();

  const finalInputs = useMemo(() => {
    return calculateDisplayInputs(channel?.properites ?? [], {});
  }, [channel?.properites]);

  const handleImport = useCallback(
    (data: any) => {
      if (!channel) {
        return;
      }

      if (channel.properites.some((it) => it.required && isEmpty(data[it.name]))) {
        toast.error(t('common.utils.fill-required'));
        return;
      }

      const { id } = channel;
      toast.promise(createLLMChannel(id, data), {
        success: () => {
          afterOperate?.();
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
    <TabularRender
      inputs={finalInputs}
      height={404}
      onSubmit={handleImport}
      miniMode
      extra={{ modelId: Number(channel?.id ?? '') }}
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
  );
};
