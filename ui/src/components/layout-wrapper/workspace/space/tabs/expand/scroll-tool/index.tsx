import React from 'react';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { CreateSpaceTab } from 'src/components/layout-wrapper/workspace/space/tabs/expand/create-tab';
import { Button } from '@/components/ui/button';

interface IScrollToolProps extends React.ComponentPropsWithoutRef<'div'> {
  tabsNode: React.RefObject<HTMLDivElement>;
}

export const ScrollTool: React.FC<IScrollToolProps> = ({ tabsNode }) => {
  return (
    <motion.div
      key="vines-workspace-scrollTool"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute right-0 z-50 flex h-full items-center bg-slate-3 pl-2 pr-4"
    >
      <div className="pointer-events-none absolute -left-4 h-full w-10 bg-gradient-to-l from-slate-3 from-60%" />
      <Button
        icon={<ChevronLeft size={16} />}
        variant="outline"
        className="!scale-75"
        onClick={() => tabsNode.current?.scrollBy({ left: -100, behavior: 'smooth' })}
      />
      <Button
        icon={<ChevronRight size={16} />}
        variant="outline"
        className="!scale-75"
        onClick={() => tabsNode.current?.scrollBy({ left: 100, behavior: 'smooth' })}
      />
      <CreateSpaceTab className="ml-0" />
    </motion.div>
  );
};
