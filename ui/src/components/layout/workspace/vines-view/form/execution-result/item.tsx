import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { omit } from 'lodash';
import { Eye } from 'lucide-react';
import Image from 'rc-image';
import { useTranslation } from 'react-i18next';

import { VinesAbstractDataPreview } from '@/components/layout/workspace/vines-view/execution/data-display/abstract';
import { VinesAbstractVideo } from '@/components/layout/workspace/vines-view/execution/data-display/abstract/node/video.tsx';
import { CodeEditor, JSONValue } from '@/components/ui/code-editor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VinesLoading } from '@/components/ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesWorkflowExecution } from '@/package/vines-flow/core/typings.ts';
import { cn } from '@/utils';

export type IVinesExecutionResultItem = VinesWorkflowExecution & {
  render: {
    type: 'image' | 'video' | 'raw' | 'empty';
    data: JSONValue;
  };
};

interface IVinesExecutionResultItemProps {
  height: number;
  data: IVinesExecutionResultItem;
}

export const VinesExecutionResultItem: React.FC<IVinesExecutionResultItemProps> = ({ data, height }) => {
  const { t } = useTranslation();

  const type = data.render.type;
  const isRenderRaw = type === 'raw';

  const renderData = data.render.data;

  const isRUNNING = data.status === 'RUNNING';

  return type === 'image' ? (
    <div className="box-border flex-none content-stretch p-3">
      <div className="vines-center overflow-hidden rounded-lg" style={{ height }}>
        <Image
          src={renderData as string}
          alt="image"
          className="aspect-square size-full transform rounded-lg border border-input object-cover object-center shadow-sm"
          loading="lazy"
          preview={{
            mask: <Eye className="stroke-white" />,
          }}
        />
      </div>
    </div>
  ) : (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <div className="box-border flex-none content-stretch p-3">
              <div
                className={cn(
                  'relative cursor-pointer overflow-hidden rounded-lg border border-input bg-background shadow-sm',
                  isRenderRaw ? 'w-full p-2' : 'size-full',
                )}
                style={{ height }}
              >
                <AnimatePresence>
                  {isRUNNING ? (
                    <motion.div
                      className="vines-center absolute left-0 top-0 size-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <VinesLoading />
                    </motion.div>
                  ) : (
                    <motion.div
                      className="group size-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isRenderRaw && <VinesAbstractDataPreview data={renderData} className="h-full" />}
                      {type === 'video' && (
                        <VinesAbstractVideo className="my-auto [&>video]:min-h-16">
                          {renderData as string}
                        </VinesAbstractVideo>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </DialogTrigger>
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
            <VinesAbstractDataPreview className="h-96" data={renderData} disabledOverflowMask />
          </TabsContent>
          <TabsContent value="logs">
            <CodeEditor className="h-96 w-full" readonly data={omit(data, 'render') as JSONValue} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
