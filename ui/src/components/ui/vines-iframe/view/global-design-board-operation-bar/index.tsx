import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { FrameSizeInput } from '@/components/ui/vines-design/frame-size-input';
import { useDesignBoardStore } from '@/store/useDesignBoardStore';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events';

import { GlobalDesignBoardOperationBarBoardSelect } from './board-select';

export const GlobalDesignBoardOperationBar = () => {
  const { t } = useTranslation();

  const { designBoardId } = useDesignBoardStore();

  const handleExport = () => {
    if (!designBoardId) return;
    VinesEvent.emit('design-board-export', designBoardId);
  };
  const handleSave = () => {
    if (!designBoardId) return;
    VinesEvent.emit('design-board-save', designBoardId);
  };

  return (
    <div
      className={cn(
        'flex h-full w-72 flex-col items-center justify-between gap-4 rounded-xl rounded-bl-xl rounded-tl-xl border border-input bg-slate-1 p-4 text-base',
      )}
    >
      <GlobalDesignBoardOperationBarBoardSelect />
      {designBoardId && (
        <motion.div
          className="flex w-full flex-col gap-4"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(10px)' }}
        >
          <div className="flex flex-col">
            <p className="mb-1.5 grid grid-cols-2 justify-start text-xs font-semibold capitalize">
              <span>{t('design.view-config.canvas-setting.width')}</span>
              <span className="pl-2">{t('design.view-config.canvas-setting.height')}</span>
            </p>
            <FrameSizeInput />
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={handleExport}>
              {t('common.utils.export')}
            </Button>
            <Button variant="outline" onClick={handleSave}>
              {t('common.utils.save')}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
