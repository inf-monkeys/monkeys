import React, { memo } from 'react';

import { motion } from 'framer-motion';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { cn } from '@/utils';

export interface ILogoProps extends React.ComponentPropsWithoutRef<'div'> {
  width?: number;
  height?: number;
  url?: string;
  alt?: string;
  description?: string;
  imageClassName?: string;
}

export const AppLogo: React.FC<ILogoProps> = memo(
  ({ url, imageClassName, alt, description, className, width, height }) => (
    <motion.div key="vines-logo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Avatar className={cn('w-auto select-none rounded', className)} style={{ width, height }}>
        <AvatarImage className={cn('aspect-auto w-auto rounded', imageClassName)} src={url} alt={alt} />
        <AvatarFallback className="min-w-32 rounded-none p-2 text-xs">{alt}</AvatarFallback>
      </Avatar>

      {description && (
        <p className="mt-2 w-full select-none rounded bg-vines-500 px-2 py-1 text-center text-xs text-white dark:bg-mauve-12 dark:text-slate-3">
          {description}
        </p>
      )}
    </motion.div>
  ),
);

AppLogo.displayName = 'AppLogo';
