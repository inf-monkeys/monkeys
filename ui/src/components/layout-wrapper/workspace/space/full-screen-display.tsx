import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { IntegrationCenter } from '@/components/layout/workspace/integration-center';
import { usePageStore } from '@/store/usePageStore';

interface IFullScreenDisplayProps {}

export const FullScreenDisplay: React.FC<IFullScreenDisplayProps> = () => {
  const apiDocumentVisible = usePageStore((s) => s.apiDocumentVisible);

  return (
    <AnimatePresence>
      {apiDocumentVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-1 left-0 top-0 z-[1000] bg-slate-1"
        >
          <IntegrationCenter />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
