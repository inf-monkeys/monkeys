import React, { useEffect, useState } from 'react';

import { useMemoizedFn } from 'ahooks';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label.tsx';
import { useForceUpdate } from '@/hooks/use-force-update.ts';
import { useVinesFlow } from '@/package/vines-flow';
import { useFlowStore } from '@/store/useFlowStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IInputWidgetsProps {}

export const InputWidgets: React.FC<IInputWidgetsProps> = () => {
  const { t } = useTranslation();

  const isLatestWorkflowVersion = useFlowStore((s) => s.isLatestWorkflowVersion);
  const workflowId = useFlowStore((s) => s.workflowId);

  const [variableId, setVariableId] = useState<string | undefined>();
  const [open, setOpen] = useState(false);

  const forceUpdate = useForceUpdate();

  const handleOpen = useMemoizedFn((_wid: string, id?: string) => {
    if (workflowId !== _wid) return;
    if (!id) {
      // 新建
    }
    setTimeout(() => forceUpdate());
    setVariableId(id);
    setOpen(true);
  });

  useEffect(() => {
    VinesEvent.on('flow-input-widgets', handleOpen);
    return () => {
      VinesEvent.off('flow-input-widgets', handleOpen);
    };
  }, []);

  const { vines } = useVinesFlow();
  const currentVariable = vines.workflowInput.find((it) => it.name === variableId);

  useEffect(() => {
    if (!currentVariable) return;
  }, [currentVariable]);

  const handleSave = useMemoizedFn(() => {
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-8xl w-[60rem] gap-2 pt-10">
        <div className="grid h-[30rem] w-full grid-cols-3 gap-4">
          <div className="space-y-4">
            <div className="border-b border-input pb-4">
              <div className="flex items-center justify-between">
                <Label>图层</Label>
                <Button className="!p-1.5" icon={<Plus />} variant="outline" size="small" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>联动参数</Label>
                <Button className="!p-1.5" icon={<Plus />} variant="outline" size="small" />
              </div>
            </div>
          </div>
          <div className="col-span-2 border-l border-input pl-4">
            <Label>实时画布</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className={cn(!isLatestWorkflowVersion && 'hidden')} onClick={handleSave}>
            {t('workspace.flow-view.endpoint.start-tool.input.config-form.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
