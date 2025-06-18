import { ChevronDownIcon, ChevronUpIcon, TrashIcon, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface RightSidebarProps {
  onBack: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onPrevImage: () => void;
  onNextImage: () => void;
  onDeleteImage: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  onBack,
  hasPrev,
  hasNext,
  onPrevImage,
  onNextImage,
  onDeleteImage,
}) => {
  const { t } = useTranslation();

  return (
    <div className="ml-4 flex h-full w-14 flex-col items-center justify-between gap-4 rounded-bl-xl rounded-br-xl rounded-tl-xl rounded-tr-xl border border-input bg-background px-2 pb-6 pt-8 shadow-sm dark:bg-[#111113]">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<X />} variant="outline" size="small" onClick={onBack} />
        </TooltipTrigger>
        <TooltipContent>{t('common.utils.back', '返回')}</TooltipContent>
      </Tooltip>

      <div className="flex flex-col items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<ChevronUpIcon />} variant="outline" size="small" disabled={!hasPrev} onClick={onPrevImage} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.prev-image', '上一张')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              icon={<ChevronDownIcon />}
              variant="outline"
              size="small"
              disabled={!hasNext}
              onClick={onNextImage}
            />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.next-image', '下一张')}</TooltipContent>
        </Tooltip>
      </div>

      <div className="mb-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<TrashIcon />} variant="outline" size="small" onClick={onDeleteImage} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.delete', '删除')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
