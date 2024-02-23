import React, { useRef, useState } from 'react';

import { useElementSize } from '@mantine/hooks';
import { motion } from 'framer-motion';

interface ISmoothTransitionProps extends React.ComponentPropsWithoutRef<'div'> {}

export const SmoothTransition: React.FC<ISmoothTransitionProps> = ({ children }) => {
  const { ref, height } = useElementSize();

  const prevHeight = useRef(0);
  const [maskHeight, setMaskHeight] = useState(18);

  return (
    <motion.div
      className="overflow-clip p-2"
      initial={{ height: 0, opacity: 0 }}
      animate={{
        height: height + 16,
        opacity: 1,
      }}
      onAnimationStart={() => {
        height - prevHeight.current > 0 && setMaskHeight(height);
        setTimeout(() => setMaskHeight(0), 100);
        prevHeight.current = height;
      }}
    >
      <motion.div
        ref={ref}
        variants={{
          visible: {
            maskImage: `linear-gradient(to bottom,transparent 0, 0, black calc(100% - ${maskHeight}px),transparent 100%)`,
          },
          hidden: {
            maskImage: `linear-gradient(to bottom,transparent 0, 0, black calc(100%),transparent 100%)`,
            transitionEnd: {
              maskImage: 'none',
            },
          },
        }}
        animate={maskHeight > 0 ? 'visible' : 'hidden'}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
