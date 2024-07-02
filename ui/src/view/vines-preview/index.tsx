import React from 'react';

import { useElementSize } from '@mantine/hooks';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { VinesExecutionHistory } from 'src/components/layout/vines-view/execution/history';

import { VinesActuator } from '@/components/layout/vines-view/execution/actuator';
import { Separator } from '@/components/ui/separator.tsx';
import { useViewStore } from '@/store/useViewStore';
import { cn } from '@/utils';
import { ViewDisable } from '@/view/vines-preview/view-disable.tsx';

// million-ignore
export const VinesPreView: React.FC = () => {
  const { t } = useTranslation();

  const { fullscreen } = useViewStore();
  const { ref, height } = useElementSize();

  const finalHeight = height - (fullscreen ? 0 : 108);

  return (
    <div ref={ref} className={cn('relative h-full max-h-full p-6', !fullscreen && 'space-y-6')}>
      <ViewDisable />
      <div className={cn('space-y-0.5', fullscreen && 'hidden')}>
        <h2 className="text-2xl font-bold tracking-tight">{t('workspace.pre-view.title')}</h2>
        <p className="text-muted-foreground">{t('workspace.pre-view.desc')}</p>
      </div>
      <Separator className={cn('my-6', fullscreen && 'hidden')} />
      <motion.div
        className="flex"
        style={{ height: finalHeight }}
        initial={{ opacity: 0 }}
        animate={{ opacity: finalHeight ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <aside className={cn('relative w-3/5', fullscreen && 'w-full')}>
          <VinesActuator height={finalHeight} />
        </aside>
        <Separator orientation="vertical" className={cn('mx-3', fullscreen && 'hidden')} />
        <div className={cn('flex-1', fullscreen && 'hidden')}>
          <VinesExecutionHistory />
        </div>
      </motion.div>
    </div>
  );
};
