import React from 'react';

import { useForceUpdate } from '@mantine/hooks';
import { AnimatePresence, motion } from 'framer-motion';
import { RouteOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useVinesFlow } from '@/package/vines-flow';

interface IViewDisableProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ViewDisable: React.FC<IViewDisableProps> = () => {
  const { t } = useTranslation();

  const { vines } = useVinesFlow();

  const useOpenAIInterface = vines.usedOpenAIInterface();
  const openAIInterfaceEnabled = useOpenAIInterface.enable;

  const forceUpdate = useForceUpdate();

  return (
    <AnimatePresence>
      {openAIInterfaceEnabled && (
        <motion.div
          key="vines-preview-view-disable"
          className="vines-center absolute left-0 top-0 z-20 flex size-full flex-col items-center gap-4 bg-white/10 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <RouteOff size={64} />
          <div className="text-center">
            <h1 className="text-xl font-bold">{t('workspace.pre-view.disable.title')}</h1>
            <span className="text-xs text-gray-10">{t('workspace.pre-view.disable.desc')}</span>
          </div>
          <Button
            size="small"
            variant="outline"
            onClick={() => {
              vines.enableOpenAIInterface = false;
              vines.emit('update-workflow', { exposeOpenaiCompatibleInterface: false });
              forceUpdate();
            }}
          >
            {t('workspace.pre-view.disable.button')}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
