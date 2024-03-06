import React, { useRef, useState } from 'react';

import { CircularProgress } from '@nextui-org/progress';
import { AnimatePresence, motion } from 'framer-motion';

import { SpaceTabs } from '@/components/layout-wrapper/workspace/space/tabs';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';

interface ISpaceProps extends React.ComponentPropsWithoutRef<'div'> {}

export const Space: React.FC<ISpaceProps> = ({ children }) => {
  const { pages, pageId } = useVinesPage();

  const node = useRef<HTMLDivElement>(null);

  const [customSettingVisible, setCustomSettingVisible] = useState(false);

  const isFirstNavActive = pageId === pages?.[0]._id;

  return (
    <>
      <SpaceTabs />
      <motion.div
        ref={node}
        animate={{ borderTopLeftRadius: isFirstNavActive ? 0 : 16 }}
        className="relative mx-3 mb-2 mt-0 h-[calc(100%-7.5rem)] w-[calc(100%-1.5rem)] overflow-clip overflow-x-clip rounded-b-2xl rounded-r-2xl bg-slate-1 shadow-md"
      >
        <AnimatePresence>
          <motion.div
            key="vines-pages-loading"
            variants={{
              visible: { opacity: 1, transition: { duration: 0.2 } },
              hidden: { opacity: 0, transition: { duration: 0.2 } },
            }}
            animate={customSettingVisible ? 'visible' : 'hidden'}
            className="pointer-events-none absolute left-0 top-0 z-[1100] flex h-full w-full items-center justify-center bg-slate-1"
          >
            <CircularProgress className="[&_circle:last-child]:stroke-vines-500" size="lg" aria-label="Loading..." />
          </motion.div>
          {children}
        </AnimatePresence>
      </motion.div>
    </>
  );
};
