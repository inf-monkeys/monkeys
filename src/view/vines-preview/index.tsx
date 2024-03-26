import React from 'react';

import { useElementSize } from '@mantine/hooks';
import { motion } from 'framer-motion';

import { VinesActuator } from '@/components/layout/vines-execution/actuator';
import { VinesExecutionHistory } from '@/components/layout/vines-execution/history';
import { Separator } from '@/components/ui/separator.tsx';

// million-ignore
export const VinesPreView: React.FC = () => {
  const { ref, height } = useElementSize();

  const finalHeight = height - 108;

  return (
    <div ref={ref} className="h-full max-h-full space-y-6 p-10">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">预览工作流</h2>
        <p className="text-muted-foreground">运行工作流或查看历史运行记录</p>
      </div>
      <Separator className="my-6" />
      <motion.div
        className="flex"
        style={{ height: finalHeight }}
        initial={{ opacity: 0 }}
        animate={{ opacity: finalHeight ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <aside className="relative w-3/5">
          <VinesActuator height={finalHeight} />
        </aside>
        <Separator orientation="vertical" className="mx-3" />
        <div className="flex-1">
          <VinesExecutionHistory />
        </div>
      </motion.div>
    </div>
  );
};
