import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { VinesAbstractDataPreview } from '@/components/layout/workspace/vines-view/_common/data-display/abstract';
import { IVinesExecutionResultItem } from '@/utils/execution.ts/index.tsx';
import { VirtuaExecutionResultRawDataDialog } from '@/utils/execution.ts/wrapper/raw-data-dialog.tsx';
import { VinesLoading } from '@/components/ui/loading';

interface IVirtuaExecutionResultGridRawItemProps {
  data: IVinesExecutionResultItem;
}

export const VirtuaExecutionResultGridRawItem: React.FC<IVirtuaExecutionResultGridRawItemProps> = ({ data }) => {
  const renderData = data.render.data;

  const isRUNNING = data.status === 'RUNNING';

  return (
    <VirtuaExecutionResultRawDataDialog data={data}>
      <div className="box-border flex flex-none content-stretch p-1">
        <div className="relative max-h-96 min-h-32 w-full min-w-64 cursor-pointer overflow-hidden rounded-lg border border-input bg-background p-2 shadow-sm">
          <AnimatePresence>
            {isRUNNING ? (
              <motion.div
                className="vines-center left-0 top-0 size-full"
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
