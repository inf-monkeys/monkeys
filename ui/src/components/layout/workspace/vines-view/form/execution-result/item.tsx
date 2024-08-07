import React, { useState } from 'react';

import { useMemoizedFn } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { omit } from 'lodash';
import { useTranslation } from 'react-i18next';
import { GridItemContent } from 'react-virtuoso';

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
    type: 'image' | 'video' | 'raw';
    data: JSONValue;
  };
};

interface IVinesExecutionResultItemProps {
  data: IVinesExecutionResultItem;
}

export const VinesExecutionResultItem: React.FC<IVinesExecutionResultItemProps> = ({ data }) => {
  const { t } = useTranslation();

  const [height, setHeight] = useState<number>();

  const ref = useMemoizedFn((node: HTMLDivElement) => {
    if (node) {
      const { width } = node.getBoundingClientRect();
      setHeight(width);
    }
  });

  const type = data.render.type;
  const isRenderRaw = type === 'raw';

  const renderData = data.render.data;

  const isRUNNING = data.status === 'RUNNING';

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <div className={cn('box-border flex-none content-stretch p-3', isRenderRaw ? 'col-span-3' : 'col-span-1')}>
              <div
                ref={ref}
                className={cn(
                  'relative cursor-pointer overflow-hidden rounded-lg border border-input bg-background shadow-sm',
                  isRenderRaw ? 'max-h-36 w-full p-2' : 'size-full',
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
                      {type === 'image' && (
                        <img
                          src={renderData as string}
                          alt="image"
                          className="aspect-square size-full transform rounded-lg object-cover object-center shadow transition-transform duration-200 ease-in-out group-hover:scale-110"
                        />
                      )}
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

export const VinesExecutionItemContent: GridItemContent<IVinesExecutionResultItem, unknown> = (index, data) => {
  return <VinesExecutionResultItem data={data} key={index} />;
};
