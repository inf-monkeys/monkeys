import React, { useState } from 'react';

import { toast } from 'sonner';

import { useCreateCredential, useCredentials } from '@/apis/credential';
import { IVinesCredentialType } from '@/apis/credential/typings.ts';
import { VinesWorkflowInput } from '@/components/layout/vines-view/execution/workflow-input';
import { calculateDisplayInputs } from '@/components/layout/vines-view/flow/headless-modal/tool-editor/config/tool-input/utils.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';

interface ICreateExternalAccountProps extends React.ComponentPropsWithoutRef<'div'> {
  detail: IVinesCredentialType | null;
}

export const CreateExternalAccount: React.FC<ICreateExternalAccountProps> = ({ children, detail }) => {
  const { trigger } = useCreateCredential();
  const finalInputs = [
    {
      name: 'displayName',
      displayName: '账号名称',
      type: 'string',
      required: true,
    },
    ...calculateDisplayInputs(detail?.properties ?? [], {}),
  ] as VinesWorkflowVariable[];

  const { mutate } = useCredentials(detail?.name);

  const [visible, setVisible] = useState(false);

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogTitle>创建新{detail?.displayName}</DialogTitle>
        <VinesWorkflowInput
          inputs={finalInputs}
          height={400}
          onSubmit={(data) => {
            const displayName = (data.displayName || `${detail?.name}账号`) as string;
            toast.promise(
              trigger({
                displayName,
                type: detail?.name as string,
                data,
              }),
              {
                loading: '正在创建',
                success: () => {
                  setVisible(false);
                  void mutate();
                  return '创建成功';
                },
                error: '创建失败',
              },
            );
          }}
        >
          <Button className="mb-1 min-h-10" variant="outline" type="submit">
            创建
          </Button>
        </VinesWorkflowInput>
      </DialogContent>
    </Dialog>
  );
};
