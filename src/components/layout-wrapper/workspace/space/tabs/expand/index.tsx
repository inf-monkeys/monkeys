import React from 'react';

import { AnimatePresence } from 'framer-motion';

import { AddSpaceTab } from '@/components/layout-wrapper/workspace/space/tabs/expand/add-tab.tsx';
import { ScrollTool } from '@/components/layout-wrapper/workspace/space/tabs/expand/scroll-tool/ScrollTool.tsx';

interface IScrollToolProps extends React.ComponentPropsWithoutRef<'div'> {
  visible: boolean;
  tabsNode: React.RefObject<HTMLDivElement>;
}

export const Expand: React.FC<IScrollToolProps> = ({ visible, tabsNode }) => {
  return <AnimatePresence>{!visible ? <AddSpaceTab /> : <ScrollTool tabsNode={tabsNode} />}</AnimatePresence>;
};
