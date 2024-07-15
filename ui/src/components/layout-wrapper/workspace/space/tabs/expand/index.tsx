import React from 'react';

import { AnimatePresence } from 'framer-motion';
import { CreateSpaceTab } from 'src/components/layout-wrapper/workspace/space/tabs/expand/create-tab';

import { ScrollTool } from '@/components/layout-wrapper/workspace/space/tabs/expand/scroll-tool';

interface IScrollToolProps extends React.ComponentPropsWithoutRef<'div'> {
  visible: boolean;
  tabsNode: React.RefObject<HTMLDivElement>;
}

export const Expand: React.FC<IScrollToolProps> = ({ visible, tabsNode }) => {
  return <AnimatePresence>{!visible ? <CreateSpaceTab /> : <ScrollTool tabsNode={tabsNode} />}</AnimatePresence>;
};
