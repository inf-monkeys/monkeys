import React, { memo, useEffect, useState } from 'react';

import data from '@emoji-mart/data';
import i18n from '@emoji-mart/data/i18n/zh.json';
import Picker from '@emoji-mart/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/utils';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface IVinesIconSelectorProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'> {
  emojiLink?: string;
  onChange?: (emojiLink: string) => void;
  onFinished?: (emojiLink: string) => void;
  onlyEmoji?: boolean;
}

const colors = ['#434343', '#f2c1be', '#fadebb', '#fef8a3', '#ceefc5', '#d1dcfb', '#d9caf8'];

export const VinesIconSelector: React.FC<IVinesIconSelectorProps> = memo(
  ({ children, onChange, emojiLink, onFinished, onlyEmoji = false }) => {
    const { t } = useTranslation();
    const [theme] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);

    const [selectedColor, setSelectedColor] = useState(colors[4]);
    const [selectedEmoji, setSelectedEmoji] = useState('🍀');

    const [visible, setVisible] = useState(false);

    useEffect(() => {
      const nextEmoji = onlyEmoji ? selectedEmoji : `emoji:${selectedEmoji}:${selectedColor}`;
      if (emojiLink !== nextEmoji && visible) {
        onChange?.(nextEmoji);
      }
    }, [selectedColor, selectedEmoji, visible]);

    useEffect(() => {
      if (emojiLink && emojiLink.startsWith('emoji:')) {
        const [, emoji, bgColor] = emojiLink.split(':');
        if (!bgColor) {
          setSelectedColor(colors[0]);
        } else {
          setSelectedColor(bgColor);
        }
        setSelectedEmoji(emoji);
      }
    }, [emojiLink]);

    return (
      <Popover open={visible} onOpenChange={setVisible}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent
          className="h-[512px] w-[352px] scale-75 overflow-hidden rounded-xl bg-slate-2 p-0"
          sideOffset={-55}
        >
          <Picker
            i18n={i18n}
            data={data}
            onEmojiSelect={(e: any) => {
              if (onlyEmoji) {
                onChange?.(e.native);
              }
              setSelectedEmoji(e.native);
            }}
            locale="zh"
            previewPosition="none"
            theme={theme}
          />
          <div className="flex h-20 w-full items-center justify-between gap-2 px-5 pb-1">
            <div className={onlyEmoji ? 'hidden' : ''}>
              <p className="mb-2 text-sm">{t('components.ui.icon-selector.background-color')}</p>
              <div className="flex items-center gap-1">
                {colors.map((color, index) => (
                  <div
                    key={index}
                    className={cn(
                      'mx-1 h-6 w-6 cursor-pointer rounded-full outline outline-[6px] outline-transparent transition-all',
                      color === selectedColor && 'outline-gray-4',
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
            <Button
              className={onlyEmoji ? 'ml-auto' : ''}
              variant="solid"
              onClick={() => {
                onFinished?.(onlyEmoji ? selectedEmoji : `emoji:${selectedEmoji}:${selectedColor}`);
                setVisible(false);
              }}
            >
              OK
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  },
);

VinesIconSelector.displayName = 'VinesIconSelector';
