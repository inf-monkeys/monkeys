import React, { memo, useEffect } from 'react';

import { motion } from 'framer-motion';
import { ListEnd } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils';

interface IAutoScrollProps extends React.ComponentPropsWithoutRef<'div'> {
  atBottom: boolean;
  onScrollToBottom: (type: 'auto' | 'click') => void;
}

export const AutoScroll = memo<IAutoScrollProps>(({ atBottom, onScrollToBottom }) => {
  useEffect(() => {
    if (atBottom) {
      onScrollToBottom?.('auto');
    }
  }, [atBottom]);

  return (
    <motion.div
      className={cn('absolute bottom-4 right-4', atBottom && 'pointer-events-none')}
      animate={{
        opacity: atBottom ? 0 : 1,
      }}
      transition={{ duration: 0.2 }}
    >
      <Button icon={<ListEnd />} onClick={() => onScrollToBottom('click')} variant="outline">
        回到底部
      </Button>
    </motion.div>
  );
});

AutoScroll.displayName = 'VinesAutoScroll';
