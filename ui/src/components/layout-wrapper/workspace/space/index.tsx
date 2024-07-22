import React, { useEffect } from 'react';

import { motion } from 'framer-motion';

import { WorkspaceCustomSetting } from '@/components/layout/workspace/custom-setting';
import { SpaceTabs } from '@/components/layout-wrapper/workspace/space/tabs';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { usePageStore } from '@/store/usePageStore';

interface ISpaceProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Space: React.FC<ISpaceProps> = ({ children }) => {
  const { ref, width, height } = useElementSize();
  const { pages, pageId } = useVinesPage();

  const { setContainerWidth, setContainerHeight, setWorkbenchVisible } = usePageStore();
  useEffect(() => {
    setContainerWidth(width);
    setContainerHeight(height);
    setWorkbenchVisible(false);
  }, [width, height]);

  const isFirstNavActive = pageId === pages?.[0].id;

  return (
    <>
      <SpaceTabs />
      <motion.div
        ref={ref}
        animate={{ borderTopLeftRadius: isFirstNavActive ? 0 : 16 }}
        className="relative mx-3 mb-2 mt-0 h-[calc(100%-7.5rem)] w-[calc(100%-1.5rem)] overflow-hidden overflow-x-clip rounded-b-2xl rounded-r-2xl bg-slate-1 shadow-sm"
      >
        <WorkspaceCustomSetting />
        {children}
      </motion.div>
    </>
  );
};
