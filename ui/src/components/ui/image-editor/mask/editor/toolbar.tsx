import React, { useRef, useState } from 'react';

import { useMemoizedFn, useThrottleEffect } from 'ahooks';
import type { EventEmitter } from 'ahooks/lib/useEventEmitter';
import { ImageUp, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { IMaskEditorEvent } from '@/components/ui/image-editor/mask/editor/index.tsx';
import { useElementSize } from '@/hooks/use-resize-observer.ts';
import { cn } from '@/utils';

interface IMaskEditorToolbarProps {
  onFileInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;

  event$: EventEmitter<IMaskEditorEvent>;
  disabledSave?: boolean;

  children?: React.ReactNode;

  mini?: boolean;
}

export const MaskEditorToolbar: React.FC<IMaskEditorToolbarProps> = ({
  onFileInputChange,
  event$,
  disabledSave,
  children,
}) => {
  const { t } = useTranslation();

  const { ref, width } = useElementSize();

  const [scrollToolVisible, setScrollToolVisible] = useState(false);
  useThrottleEffect(
    () => {
      if (width) {
        setScrollToolVisible(width < 416);
      }
    },
    [width],
    { wait: 100 },
  );

  const handleSelectLocalImage = useMemoizedFn(() => {
    const inputElement = document.createElement('input');
    inputElement.type = 'file';
    inputElement.accept = 'image/*';
    inputElement.onchange = (e) => {
      onFileInputChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    };
    inputElement.click();
  });

  const toolbarRef = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={ref} className="relative flex w-full items-center">
      <div ref={toolbarRef} className="flex w-full overflow-hidden">
        <div className={cn('flex w-full items-center justify-between', scrollToolVisible && '')}>
          <div className="flex items-center gap-2">
            {children}
            <Button
              className="border-transparent !p-1 shadow-none"
              variant="outline"
              size="small"
              icon={<ImageUp />}
              onClick={handleSelectLocalImage}
            >
              {t('components.ui.vines-image-mask-editor.toolbar.select-image')}
            </Button>
          </div>
          <Button
            className="border-transparent !p-1 shadow-none"
            variant="outline"
            size="small"
            icon={<Save />}
            disabled={disabledSave}
            onClick={() => event$.emit('save')}
          >
            {t('components.ui.vines-image-mask-editor.toolbar.save')}
          </Button>
        </div>
      </div>
      {/* <AnimatePresence>
        {scrollToolVisible && (
          <motion.div
            key="vines-workspace-scrollTool"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 z-50 flex h-full items-center gap-1 bg-slate-1 pl-1"
          >
            <div className="pointer-events-none absolute -left-6 h-full w-8 bg-gradient-to-l from-slate-1 from-30%" />
            <Button
              icon={<ChevronLeft size={16} />}
              variant="outline"
              className="z-10 !p-1 [&_svg]:!size-3"
              onClick={() => toolbarRef.current?.scrollBy({ left: -100, behavior: 'smooth' })}
            />
            <Button
              icon={<ChevronRight size={12} />}
              variant="outline"
              className="z-10 !p-1 [&_svg]:!size-3"
              onClick={() => toolbarRef.current?.scrollBy({ left: 100, behavior: 'smooth' })}
            />
          </motion.div>
        )}
      </AnimatePresence> */}
    </div>
  );
};
