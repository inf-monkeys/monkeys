import React from 'react';

import { motion } from 'framer-motion';
import { isBoolean } from 'lodash';

import { WorkflowInputList } from '@/components/layout/vines-flow/headless-modal/endpoint/start-tool/workflow-input-config/input-config/input-list';
import { useVinesFlow } from '@/package/vines-flow';

interface IInputPreviewProps extends React.ComponentPropsWithoutRef<'div'> {}

export const InputPreview: React.FC<IInputPreviewProps> = () => {
  const { vines } = useVinesFlow();

  const inputs = vines.workflowInput.map((it) =>
    isBoolean(it.default) ? { ...it, default: it.default.toString() } : it,
  );

  return (
    <motion.div
      className="absolute top-0 w-[calc(100%-2.5rem)]"
      key="complicate-input-preview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {inputs.length ? (
        <WorkflowInputList inputs={inputs} />
      ) : (
        <div className="vines-center size-full">
          <h1 className="font-bold">暂无输入</h1>
        </div>
      )}
    </motion.div>
  );
};
