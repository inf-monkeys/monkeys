import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useCanvasStore } from '@/store/useCanvasStore';
import { CanvasStatus } from '@/store/useFlowStore/typings.ts';

interface ISimplifyEndNodeExpandProps {}

export const SimplifyEndNodeExpand: React.FC<ISimplifyEndNodeExpandProps> = () => {
  const { t } = useTranslation();

  const { canvasMode } = useCanvasStore();
  const visible = canvasMode === CanvasStatus.EDIT;

  return (
    <div className="absolute flex select-none flex-col gap-1">
      <h1 className="text-xl font-bold leading-6">{t('workspace.flow-view.vines.tools.end.name')}</h1>
      <AnimatePresence>
        {visible && (
          <motion.div
            key="workflow_start_expand_desc"
            initial={{ opacity: 0, marginTop: -24 }}
            animate={{ opacity: 1, marginTop: 0 }}
            exit={{ opacity: 0, marginTop: -24 }}
          >
            <span className="text-sm text-opacity-70">{t('workspace.flow-view.vines.tools.end.desc')}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
