import React from 'react';

import { CircularProgress } from '@/components/ui/circular-progress';
import { motion } from 'framer-motion';

interface ILoadingProps {
  motionKey: React.Key | null | undefined;
}

export const Loading: React.FC<ILoadingProps> = ({ motionKey }) => {
  return (
    <motion.div
      className="vines-center absolute size-full"
      key={motionKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
    </motion.div>
  );
};
