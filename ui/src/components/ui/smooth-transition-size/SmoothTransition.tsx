import React from 'react';

import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { motion } from 'framer-motion';
interface ISmoothTransitionProps extends React.ComponentPropsWithoutRef<'div'> {
  initialHeight?: number;
  onAnimationComplete?: () => void;
}

export const SmoothTransition: React.FC<ISmoothTransitionProps> = ({
  className,
  initialHeight = 0,
  children,
  onAnimationComplete,
  ...props
}) => {
  const { ref, height } = useElementSize();

  return (
    <motion.div
      className={className}
      initial={{ height: initialHeight, opacity: initialHeight ? 1 : 0 }}
      animate={{
        height: height ? height : initialHeight,
        opacity: 1,
        transition: {
          delay: 0.08,
          duration: 0.2,
        },
      }}
      onAnimationComplete={onAnimationComplete}
    >
      <div ref={ref} {...props}>
        {children}
      </div>
    </motion.div>
  );
};
