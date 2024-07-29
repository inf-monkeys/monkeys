import React from 'react';

import { AnimatePresence } from 'framer-motion';

interface IScrollToolProps extends React.ComponentPropsWithoutRef<'div'> {
  visible: boolean;
  tabsNode: React.RefObject<HTMLDivElement>;
}

export const Expand: React.FC<IScrollToolProps> = ({ visible, tabsNode }) => {
  return <AnimatePresence></AnimatePresence>;
};
