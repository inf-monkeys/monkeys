import React, { forwardRef, useEffect } from 'react';

import { useCreation } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';

import { VinesLoading } from '@/components/ui/loading';
import { LucideIconRender } from '@/components/ui/vines-icon/lucide/render.tsx';
import { splitEmojiLink } from '@/components/ui/vines-icon/utils.ts';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/utils';
import { emojiRegex } from '@/utils/emoji-regex.ts';
import VinesEvent from '@/utils/events.ts';

interface IVinesLucideIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  src: string;
  size?: number;
}

export const VinesLucideIcon = forwardRef<HTMLDivElement, IVinesLucideIconProps>(
  ({ src, className, style, ...attr }, ref) => {
    const initialized = useAppStore((s) => s.iconInitialized);
    const iconNames = useAppStore((s) => s.iconNames);

    useEffect(() => {
      if (!initialized) {
        VinesEvent.emit('vines-trigger-init-icons');
      }
    }, [initialized]);

    const { isLucide, finalSrc } = useCreation(() => {
      if (emojiRegex().test(src)) {
        return { finalSrc: src, isLucide: false };
      }

      if (iconNames.includes(src)) {
        return { finalSrc: src, isLucide: true };
      }

      const { text, emoji } = splitEmojiLink(src);

      if (emojiRegex().test(text)) {
        return { finalSrc: text, isLucide: false };
      }

      if (iconNames.includes(text)) {
        return { finalSrc: text, isLucide: true };
      }

      return { finalSrc: emoji, isLucide: false };
    }, [src, iconNames]);

    return (
      <AnimatePresence mode="popLayout">
        {initialized ? (
          <motion.div
            ref={ref}
            key={`${finalSrc}-vines-icon`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {isLucide ? <LucideIconRender src={finalSrc} className={className} style={style} {...attr} /> : finalSrc}
          </motion.div>
        ) : (
          <motion.div
            key={`${finalSrc}-vines-icon-loading`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn('vines-center relative', className)}
            style={style}
          >
            <svg width={24} height={24} viewBox="0 0 24 24" />
            <div className="vines-center absolute left-0 top-0">
              <VinesLoading size="sm" className="-m-1.5 scale-50" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);

VinesLucideIcon.displayName = 'VinesLucideIcon';
