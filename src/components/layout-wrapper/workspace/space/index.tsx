import React, { useRef } from 'react';

import { motion } from 'framer-motion';

import { WorkspaceCustomSetting } from '@/components/layout/workspace/custom-setting';
import { SpaceTabs } from '@/components/layout-wrapper/workspace/space/tabs';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';

interface ISpaceProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Space: React.FC<ISpaceProps> = ({ children }) => {
  const { pages, pageId } = useVinesPage();

  const node = useRef<HTMLDivElement>(null);

  const isFirstNavActive = pageId === pages?.[0]._id;

  return (
    <>
      <SpaceTabs />
      <motion.div
        ref={node}
        animate={{ borderTopLeftRadius: isFirstNavActive ? 0 : 16 }}
        className="relative mx-3 mb-2 mt-0 h-[calc(100%-7.5rem)] w-[calc(100%-1.5rem)] overflow-clip overflow-x-clip rounded-b-2xl rounded-r-2xl bg-slate-1 shadow-md"
      >
        <WorkspaceCustomSetting />
        {children}
      </motion.div>
    </>
  );
};
