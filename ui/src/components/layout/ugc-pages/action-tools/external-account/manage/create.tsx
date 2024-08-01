import React, { useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCreateCredential, useCredentials } from '@/apis/credential';
import { IVinesCredentialType } from '@/apis/credential/typings.ts';
import { calculateDisplayInputs } from '@/components/layout/workspace/vines-view/flow/headless-modal/tool-editor/config/tool-input/utils.ts';
import { TabularRender } from '@/components/layout/workspace/vines-view/form/tabular/render';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesWorkflowVariable } from '@/package/vines-flow/core/tools/typings.ts';

interface ICreateExternalAccountProps extends React.ComponentPropsWithoutRef<'div'> {
  detail: IVinesCredentialType | null;
}

export const CreateExternalAccount: React.FC<ICreateExternalAccountProps> = ({ children, detail }) => {
  const { t } = useTranslation();
  const { trigger } = useCreateCredential();
  const finalInputs = useMemo(() => {
    return [
      {
        name: 'displayName',
        displayName: t('ugc-page.action-tools.ugc-view.subtitle.external-account.manage.create.columns.displayName'),
        type: 'string',
        required: true,
      },
      ...calculateDisplayInputs(detail?.properties ?? [], {}),
    ] as VinesWorkflowVariable[];
  }, [detail?.properties]);

  const { mutate } = useCredentials(detail?.name);

  const [visible, setVisible] = useState(false);

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogTitle>
          {t('ugc-page.action-tools.ugc-view.subtitle.external-account.manage.create.title', {
            name: detail?.displayName,
          })}
        </DialogTitle>
        <TabularRender
          inputs={finalInputs}
          height={400}
          onSubmit={(data) => {
            const displayName = (data.displayName ||
              t('ugc-page.action-tools.ugc-view.subtitle.external-account.manage.create.utils.name', {
                name: detail?.displayName,
              })) as string;
            toast.promise(
              trigger({
                displayName,
                type: detail?.name as string,
                data,
              }),
              {
                loading: t('common.create.loading'),
                success: () => {
                  setVisible(false);
                  void mutate();
                  return t('common.create.success');
                },
                error: t('common.create.error'),
              },
            );
          }}
          miniMode
        >
          <Button className="mb-1 min-h-10" variant="outline" type="submit">
            {t('common.utils.create')}
          </Button>
        </TabularRender>
      </DialogContent>
    </Dialog>
  );
};
