import React from 'react';

import { useElementSize } from '@mantine/hooks';
import { motion } from 'framer-motion';
interface ISmoothTransitionProps extends React.ComponentPropsWithoutRef<'div'> {}

export const SmoothTransition: React.FC<ISmoothTransitionProps> = ({ children }) => {
  const { ref, height } = useElementSize();

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{
        height: height,
        opacity: 1,
      }}
    >
      <div ref={ref}>{children}</div>
    </motion.div>
  );
};
