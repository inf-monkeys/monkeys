import { motion } from 'framer-motion';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Separator } from '@/components/ui/separator.tsx';

interface ErrorBoundaryProps {
  error: Error;
}

export function ErrorComponent({ error }: ErrorBoundaryProps) {
  return (
    <motion.div
      key="vines-catch-boundary"
      className="m-6 flex max-w-full flex-col gap-4 rounded-md border border-solid border-white border-opacity-20 bg-slate-1 p-4 shadow backdrop-blur-sm"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
    >
      <div className="flex items-center gap-2 font-bold text-red-500">
        <h1 className="leading-tight text-red-10">出现了一些问题</h1>
      </div>
      <div className="max-w-full overflow-hidden rounded bg-gray-10 bg-opacity-10 p-2 backdrop-blur-sm">
        <Collapsible defaultOpen>
          <CollapsibleTrigger asChild>
            <p className="text-sm text-red-500">{error.message}</p>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator className="my-2" />
            <ScrollArea className="h-40">
              <pre className="text-xs">{error?.stack}</pre>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </motion.div>
  );
}
