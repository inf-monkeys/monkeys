import React from 'react';

import { AnimatePresence } from 'framer-motion';

import { AddSpaceTab } from '@/components/layout-wrapper/workspace/space/tabs/scroll-tool/add-tab.tsx';

interface IScrollToolProps extends React.ComponentPropsWithoutRef<'div'> {
  visible: boolean;
}

export const ScrollTool: React.FC<IScrollToolProps> = ({ visible }) => {
  return <AnimatePresence>{!visible && <AddSpaceTab />}</AnimatePresence>;
};
