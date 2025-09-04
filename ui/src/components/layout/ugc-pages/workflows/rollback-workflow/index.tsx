import React, { useState } from 'react';

import { useMemoizedFn } from 'ahooks';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { rollbackWorkflow } from '@/apis/workflow';
import { useWorkflowVersions } from '@/apis/workflow/version';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { IRollbackWorkflowContext } from './typings';

interface IRollbackWorkflowProps {
  visible: boolean;
  setVisible: (v: boolean) => void;
  context?: IRollbackWorkflowContext;
  onSuccess?: () => void;
}

export const RollbackWorkflow: React.FC<IRollbackWorkflowProps> = ({ visible, setVisible, context, onSuccess }) => {
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | undefined>();

  const { data: versions } = useWorkflowVersions(context?.workflowId);

  const handleRollback = useMemoizedFn(async () => {
    if (!context?.workflowId || !selectedVersion) {
      toast.warning(t('common.toast.loading'));
      return;
    }

    setIsLoading(true);

    toast.promise(rollbackWorkflow(context.workflowId, selectedVersion), {
      loading: t('common.operate.loading'),
      success: () => {
        setVisible(false);
        setSelectedVersion(undefined);
        onSuccess?.();
        return t('common.operate.success');
      },
      error: t('common.operate.error'),
      finally: () => setIsLoading(false),
    });
  });

  const handleCancel = useMemoizedFn(() => {
    setVisible(false);
    setSelectedVersion(undefined);
  });

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('components.layout.ugc.rollback-dialog.title')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-global">
          <span>{t('components.layout.ugc.rollback-dialog.description')}</span>
          <div>
            <Label htmlFor="version-select">{t('components.layout.ugc.rollback-dialog.version.label')}</Label>
            <Select value={selectedVersion?.toString()} onValueChange={(value) => setSelectedVersion(Number(value))}>
              <SelectTrigger id="version-select">
                <SelectValue placeholder={t('components.layout.ugc.rollback-dialog.version.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {versions?.map((version) => (
                  <SelectItem key={version.version} value={version.version.toString()}>
                    {t('components.layout.ugc.rollback-dialog.version-item.label', {
                      version: version.version,
                      date: new Date(version.updatedTimestamp || version.createdTimestamp).toLocaleString(),
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {versions?.length === 0 && (
            <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
              {t('components.layout.ugc.rollback-dialog.no-versions')}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleCancel} disabled={isLoading}>
            {t('common.utils.cancel')}
          </Button>
          <Button
            variant="solid"
            onClick={handleRollback}
            loading={isLoading}
            disabled={!selectedVersion || versions?.length === 0}
          >
            {t('common.utils.rollback')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
