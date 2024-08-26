import React from 'react';

import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible.tsx';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { TooltipProvider } from '@/components/ui/tooltip';
import { clearAllLocalData } from '@/hooks/use-local-storage';

interface ErrorBoundaryProps {
  error: Error;
}

export function ErrorComponent({ error }: ErrorBoundaryProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      key="vines-catch-boundary"
      className="m-6 flex max-w-full flex-col gap-4 rounded-md border border-solid border-white border-opacity-20 bg-slate-1 p-4 shadow backdrop-blur-sm"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
    >
      <div className="flex items-center gap-2 font-bold text-red-500">
        <h1 className="leading-tight text-red-10">{t('system.error.title')}</h1>
      </div>
      <span className="-mt-4 text-sm text-muted-foreground">{t('system.error.desc')}</span>
      <div className="max-w-full overflow-hidden rounded bg-gray-10 bg-opacity-10 p-2 backdrop-blur-sm">
        <Collapsible defaultOpen>
          <CollapsibleTrigger asChild>
            <p className="text-sm text-red-500">{error.message}</p>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator className="my-2" />
            <ScrollArea className="h-40" disabledOverflowMask>
              <pre className="text-xs">{error?.stack}</pre>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      </div>
      <TooltipProvider delayDuration={100}>
        <div className="flex items-center gap-2">
          <VinesDarkMode />
          <I18nSelector />
          <Button
            size="small"
            variant="outline"
            icon={<Wrench />}
            onClick={() => {
              clearAllLocalData();
              window.location.href = '/login';
            }}
          >
            {t('system.error.try-to-fix')}
          </Button>
        </div>
      </TooltipProvider>
    </motion.div>
  );
}
