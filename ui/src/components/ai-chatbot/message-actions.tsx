import { memo } from 'react';

import { CopyIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useCopy } from '@/hooks/use-copy';

import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { ChatMessage } from './typings';

export function PureMessageActions({ message, isLoading }: { message: ChatMessage; isLoading: boolean }) {
  const { copy } = useCopy();

  if (isLoading) return null;
  if (message.role === 'user') return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-row gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const textFromParts = message.parts
                  ?.filter((part) => part.type === 'text')
                  .map((part) => part.text)
                  .join('\n')
                  .trim();

                if (!textFromParts) {
                  toast.error("There's no text to copy!");
                  return;
                }

                copy(textFromParts);
                toast.success('Copied to clipboard!');
              }}
            >
              <CopyIcon size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export const MessageActions = memo(PureMessageActions, (prevProps, nextProps) => {
  if (prevProps.isLoading !== nextProps.isLoading) return false;

  return true;
});
