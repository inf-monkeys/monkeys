import React from 'react';

import { motion } from 'framer-motion';

interface IInputPreviewProps extends React.ComponentPropsWithoutRef<'div'> {}

export const InputPreview: React.FC<IInputPreviewProps> = () => {
  return (
    <motion.div
      className="absolute top-0 w-[calc(100%-2.5rem)]"
      key="complicate-input-preview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    ></motion.div>
  );
};
