import React, { useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createLLMChannel } from '@/apis/llm';
import { ILLMChannel } from '@/apis/llm/typings';
import { VinesWorkflowInput } from '@/components/layout/vines-view/execution/workflow-input';
import { calculateDisplayInputs } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/utils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx';
import { Button } from '@/components/ui/button';

interface IUgcImportDialogProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  channel?: ILLMChannel;
  afterOperate?: () => void;
}

export const LLMChannelImportDialog: React.FC<IUgcImportDialogProps> = ({
  visible,
  setVisible,
  channel,
  afterOperate,
}) => {
  const { t } = useTranslation();

  const handleImport = useCallback(
    (data: any) => {
      if (!channel) {
        return;
      }
      const { id } = channel;
      toast.promise(createLLMChannel(id, data), {
        success: () => {
          setVisible(false);
          afterOperate?.();
          return t('common.operate.success');
        },
        error: t('common.operate.error'),
        loading: t('common.operate.loading'),
      });
    },
    [channel],
  );

  const finalInputs = useMemo(() => {
    return calculateDisplayInputs(channel?.properites ?? [], {});
  }, [channel?.properites]);

  return (
    <AlertDialog open={visible} onOpenChange={setVisible}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{channel?.displayName}</AlertDialogTitle>
          <AlertDialogDescription></AlertDialogDescription>
        </AlertDialogHeader>
        <VinesWorkflowInput
          inputs={finalInputs}
          height={400}
          onSubmit={(data) => {
            handleImport(data);
          }}
        >
          <Button className="mb-1 min-h-10" variant="outline" type="submit">
            {t('common.utils.confirm')}
          </Button>
        </VinesWorkflowInput>
      </AlertDialogContent>
    </AlertDialog>
  );
};
