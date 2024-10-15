import React from 'react';

import { omit } from 'lodash';
import { useTranslation } from 'react-i18next';

import { VinesAbstractDataPreview } from '@/components/layout/workspace/vines-view/_common/data-display/abstract';
import { IVinesExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item';
import { CodeEditor, JSONValue } from '@/components/ui/code-editor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IVirtuaExecutionResultRawDataDialogProps {
  children: React.ReactNode;

  data: IVinesExecutionResultItem;
}

export const VirtuaExecutionResultRawDataDialog: React.FC<IVirtuaExecutionResultRawDataDialogProps> = ({
  children,
  data,
}) => {
  const { t } = useTranslation();

  const alt = data.render?.alt;

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>{children}</DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{t('workspace.pre-view.actuator.detail.form-render.tips')}</TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-[30rem] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('workspace.pre-view.actuator.detail.form-render.title')}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="data">
          <TabsList>
            <TabsTrigger value="data">{t('workspace.pre-view.actuator.detail.form-render.tabs.data')}</TabsTrigger>
            <TabsTrigger value="logs">{t('workspace.pre-view.actuator.detail.form-render.tabs.logs')}</TabsTrigger>
          </TabsList>
          <TabsContent value="data">
            <VinesAbstractDataPreview className="h-96" data={data.render.data} />
            {alt && <div className="rounded border p-2 text-sm">{alt}</div>}
          </TabsContent>
          <TabsContent value="logs">
            <CodeEditor className="h-96 w-full" readonly data={omit(data, 'render') as JSONValue} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
