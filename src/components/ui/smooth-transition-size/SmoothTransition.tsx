import React from 'react';

import { useElementSize } from '@mantine/hooks';
import { motion } from 'framer-motion';
interface ISmoothTransitionProps extends React.ComponentPropsWithoutRef<'div'> {
  initialHeight?: number;
}

export const SmoothTransition: React.FC<ISmoothTransitionProps> = ({ initialHeight = 0, children }) => {
  const { ref, height } = useElementSize();

  return (
    <motion.div
      initial={{ height: initialHeight, opacity: initialHeight ? 1 : 0 }}
      animate={{
        height: height ? height : initialHeight,
        opacity: 1,
      }}
    >
      <div ref={ref}>{children}</div>
    </motion.div>
  );
};
