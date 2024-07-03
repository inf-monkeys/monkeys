import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { IVinesNodeCustomData } from '@/package/vines-flow/core/nodes/typings.ts';
import { useVinesFlow } from '@/package/vines-flow/use.ts';
import { cn, getI18nContent } from '@/utils';

interface ISimplifyNodeExpandProps {
  nodeId: string;
  customData: IVinesNodeCustomData;
  toolName: string;
}

export const SimplifyNodeExpand: React.FC<ISimplifyNodeExpandProps> = ({ nodeId, customData, toolName }) => {
  const { t } = useTranslation();

  const { vines } = useVinesFlow();

  const toolDef = vines.getTool(toolName);

  const isErrorNode = !toolDef;

  const displayName = customData?.title ?? toolDef?.displayName ?? toolName;
  const description =
    getI18nContent(customData?.description) ??
    getI18nContent(toolDef?.description) ??
    (isErrorNode ? t('workspace.flow-view.vines.tools.unknown') : '');
  const displayDesc = description.length > 36 ? `${description.slice(0, 36)}...` : description;

  const loading = vines.status === 'idle';

  return (
    <AnimatePresence>
      {toolName && !loading && (
        <motion.div
          className="absolute flex select-none flex-col gap-2"
          key={nodeId + '_expand'}
          initial={{
            opacity: 0,
            marginLeft: -10,
          }}
          animate={{
            opacity: 1,
            marginLeft: 0,
          }}
          exit={{
            opacity: 0,
            marginLeft: -10,
          }}
        >
          <AnimatePresence>
            {displayName && (
              <motion.h1
                key={nodeId + '_expand_name'}
                initial={{
                  opacity: 0,
                  marginTop: -24,
                }}
                animate={{
                  opacity: 1,
                  marginTop: 0,
                }}
                exit={{
                  opacity: 0,
                  marginTop: -24,
                }}
                className="text-xl font-bold leading-none"
              >
                {getI18nContent(displayName)}
              </motion.h1>
            )}
            {displayDesc && (
              <motion.div
                key={nodeId + '_expand_desc'}
                initial={{
                  opacity: 0,
                  marginTop: -24,
                }}
                animate={{
                  opacity: 1,
                  marginTop: 0,
                }}
                exit={{
                  opacity: 0,
                  marginTop: -24,
                }}
                className={cn('leading-2 text-xs text-opacity-70', isErrorNode && '!text-red-10')}
              >
                {getI18nContent(displayDesc)}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
