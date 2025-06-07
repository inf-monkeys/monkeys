import React from 'react';

import { Book, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useShouldShowFormButton } from '@/store/useShouldShowFormButton';
import { cn } from '@/utils';

interface TextWithButtonsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
  onSmartOptimize?: () => void;
  onShowDictionary?: () => void;
}

export const TextWithButtons: React.FC<TextWithButtonsProps> = ({
  value,
  onChange,
  placeholder,
  minHeight = 40,
  maxHeight = 200,
  className,
  onSmartOptimize,
  onShowDictionary,
}) => {
  const shouldShouldFormButtons = useShouldShowFormButton();
  const { t } = useTranslation();

  return (
    <div className="relative">
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'flex h-[180px] w-full resize-none rounded-md border border-input bg-[#FFFFFF] px-3 py-2 pr-4 text-sm text-gray-500 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#111113]',
          className,
        )}
        style={{ height: '180px' }}
      />
      {false && (
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Button
            variant="outline"
            size="small"
            className="vines-button flex select-none items-center justify-center gap-1 whitespace-nowrap rounded-md border border-input bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm ring-offset-background transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-[#1E1E1E] dark:text-white dark:hover:bg-[#2D2D2D] dark:hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onSmartOptimize?.();
            }}
          >
            <RefreshCcw className="h-4 w-4 text-gray-800 dark:text-white" />
            智能优化
          </Button>
          <Button
            variant="outline"
            size="small"
            className="vines-button flex select-none items-center justify-center gap-1 whitespace-nowrap rounded-md border border-input bg-white px-3 py-1 text-sm font-medium text-gray-800 shadow-sm ring-offset-background transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vines-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:bg-[#1E1E1E] dark:text-white dark:hover:bg-[#2D2D2D] dark:hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onShowDictionary?.();
            }}
          >
            <Book className="h-4 w-4 text-gray-800 dark:text-white" />
            提示词词典
          </Button>
        </div>
      )}
    </div>
  );
};
