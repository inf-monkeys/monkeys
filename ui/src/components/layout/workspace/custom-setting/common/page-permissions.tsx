import React from 'react';

import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useToggleWorkflowPermission } from '@/apis/workflow';
import { useVinesOriginWorkflow } from '@/components/layout-wrapper/workspace/utils.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Switch } from '@/components/ui/switch';

interface IPagePermissionsProps extends React.ComponentPropsWithoutRef<'div'> {}

export const PagePermissions: React.FC<IPagePermissionsProps> = () => {
  const { t } = useTranslation();

  const { workflow, mutateWorkflow, workflowId } = useVinesOriginWorkflow();

  const { trigger } = useToggleWorkflowPermission(workflowId);

  const isUnauthorized = !!workflow?.['notAuthorized'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('workspace.wrapper.settings.common.share-view.title')}</CardTitle>
        <CardDescription>{t('workspace.wrapper.settings.common.share-view.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch
            checked={isUnauthorized}
            onCheckedChange={(checked) => {
              toast.promise(trigger({ notAuthorized: checked }), {
                loading: t('workspace.wrapper.settings.common.share-view.loading'),
                success: t('workspace.wrapper.settings.common.share-view.success'),
                error: t('workspace.wrapper.settings.common.share-view.error'),
                finally: () => void mutateWorkflow(),
              });
            }}
            size="small"
          />
          <span className="text-xs">{t('workspace.wrapper.settings.common.share-view.switch')}</span>
        </div>
        {isUnauthorized && (
          <div className="flex items-center space-x-1">
            <Info size={16} className="stroke-red-10" />
            <span className="text-xs text-red-10">{t('workspace.wrapper.settings.common.share-view.tips')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
