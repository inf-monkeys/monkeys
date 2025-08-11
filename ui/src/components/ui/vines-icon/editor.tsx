import React, { useState } from 'react';

import { RotateCcw, Palette, Image } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VinesEmojiSelector } from 'src/components/ui/emoji-selector';
import { VinesIconSelector } from '@/components/ui/icon-selector';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { IVinesIconSize, VinesIcon } from '@/components/ui/vines-icon/index.tsx';
import { DEFAULT_WORKFLOW_ICON_URL } from '@/consts/icons.ts';

interface IVinesIconEditorProps {
  value: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onFinished?: (value: string) => void;
  size?: IVinesIconSize;
  onlyEmoji?: boolean;
}

export const VinesIconEditor: React.FC<IVinesIconEditorProps> = ({
  value,
  defaultValue,
  onChange,
  onFinished,
  size = 'lg',
  onlyEmoji = false,
}) => {
  const { t } = useTranslation();
  const [iconType, setIconType] = useState<'emoji' | 'icon'>('emoji');
  const [iconDialogOpen, setIconDialogOpen] = useState(false);

  // 判断当前图标类型
  const isEmojiIcon = value && value.startsWith('emoji:');
  const isIconIcon = value && !value.startsWith('emoji:');

  // 初始化图标类型
  React.useEffect(() => {
    if (isEmojiIcon) {
      setIconType('emoji');
    } else if (isIconIcon) {
      setIconType('icon');
    }
  }, [value]);

  // 处理图标选择
  const handleIconSelect = (iconName: string) => {
    onChange?.(iconName);
    setIconDialogOpen(false);
  };

  // 处理emoji选择
  const handleEmojiSelect = (emojiLink: string) => {
    onChange?.(emojiLink);
  };

  // 重置图标
  const handleReset = () => {
    const resetValue = defaultValue || (onlyEmoji ? '🍀' : DEFAULT_WORKFLOW_ICON_URL);
    onChange?.(resetValue);
    
    // 根据重置值设置图标类型
    if (resetValue.startsWith('emoji:')) {
      setIconType('emoji');
    } else {
      setIconType('icon');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* 图标类型切换按钮 */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={iconType === 'emoji' ? 'solid' : 'outline'}
          size="small"
          onClick={() => setIconType('emoji')}
          className="flex items-center gap-1"
        >
          <Palette size={14} />
          Emoji
        </Button>
        <Button
          type="button"
          variant={iconType === 'icon' ? 'solid' : 'outline'}
          size="small"
          onClick={() => setIconType('icon')}
          className="flex items-center gap-1"
        >
          <Image size={14} />
          Icon
        </Button>
      </div>

      {/* 图标编辑器 */}
      <div className="flex">
        {iconType === 'emoji' ? (
          <VinesEmojiSelector 
            emojiLink={isEmojiIcon ? value : undefined} 
            onChange={handleEmojiSelect} 
            onFinished={onFinished} 
            onlyEmoji={onlyEmoji}
          >
            <div className="relative cursor-pointer">
              <VinesIcon size={size} className={onlyEmoji ? 'border border-input' : ''}>
                {isEmojiIcon ? value : 'emoji:🎨:#eeeef1'}
              </VinesIcon>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="absolute bottom-0 right-0 cursor-pointer rounded-br-md rounded-tl-md bg-white bg-opacity-45 p-1 shadow hover:bg-opacity-60 [&_svg]:stroke-vines-500"
                    onClick={(e) => {
                      e.preventDefault();
                      handleReset();
                    }}
                  >
                    <RotateCcw size={8} />
                  </div>
                </TooltipTrigger>
                <TooltipContent>{t('common.utils.reset')}</TooltipContent>
              </Tooltip>
            </div>
          </VinesEmojiSelector>
        ) : (
          <Dialog open={iconDialogOpen} onOpenChange={setIconDialogOpen}>
            <DialogTrigger asChild>
              <div className="relative cursor-pointer">
                <VinesIcon size={size}>
                  {isIconIcon ? value : 'link'}
                </VinesIcon>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute bottom-0 right-0 cursor-pointer rounded-br-md rounded-tl-md bg-white bg-opacity-45 p-1 shadow hover:bg-opacity-60 [&_svg]:stroke-vines-500"
                      onClick={(e) => {
                        e.preventDefault();
                        handleReset();
                      }}
                    >
                      <RotateCcw size={8} />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{t('common.utils.reset')}</TooltipContent>
                </Tooltip>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-[500px]">
              <DialogTitle>选择图标</DialogTitle>
              <VinesIconSelector onIconSelect={handleIconSelect} />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
