import React, { useMemo } from 'react';

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
import { useTranslation } from 'react-i18next';

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

  const handleImport = async () => {};

  const finalInputs = useMemo(() => {
    console.log(channel?.properites);
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
            console.log(data);
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
