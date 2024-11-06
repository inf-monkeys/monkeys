import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { VinesAbstractDataPreview } from '@/components/layout/workspace/vines-view/_common/data-display/abstract';
import { IVinesExecutionResultItem } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/index.tsx';
import { VirtuaExecutionResultRawDataDialog } from '@/components/layout/workspace/vines-view/form/execution-result/virtua/item/wrapper/raw-data-dialog.tsx';
import { VinesLoading } from '@/components/ui/loading';
import { cn } from '@/utils';

interface IVirtuaExecutionResultGridRawItemProps {
  data: IVinesExecutionResultItem;
}

export const VirtuaExecutionResultGridRawItem: React.FC<IVirtuaExecutionResultGridRawItemProps> = ({ data }) => {
  const renderData = data.render.data;

  const isRUNNING = data.status === 'RUNNING';

  return (
    <VirtuaExecutionResultRawDataDialog data={data}>
      <div className={cn('box-border flex max-h-96 flex-none content-stretch p-1', isRUNNING && 'min-h-48')}>
        <div className="relative w-full cursor-pointer overflow-hidden rounded-lg border border-input bg-background p-2 shadow-sm">
          <AnimatePresence>
            {isRUNNING ? (
              <motion.div
                className="vines-center absolute left-0 top-0 size-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <VinesLoading />
              </motion.div>
            ) : (
              <motion.div
                className="group size-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <VinesAbstractDataPreview data={renderData} className="h-full" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </VirtuaExecutionResultRawDataDialog>
  );
};
