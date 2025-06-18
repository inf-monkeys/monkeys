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
    <div className="flex h-full w-[calc(28px+1rem+2rem)] flex-col items-center justify-between gap-4 rounded-bl-xl rounded-br-xl rounded-tl-xl rounded-tr-xl border border-input bg-slate-1 p-4 shadow-sm dark:bg-[#111113]">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<X />} variant="outline" onClick={onBack} />
        </TooltipTrigger>
        <TooltipContent>{t('common.utils.back')}</TooltipContent>
      </Tooltip>

      <div className="flex flex-col items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<ChevronUpIcon />} variant="outline" disabled={!hasPrev} onClick={onPrevImage} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.prev-image')}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button icon={<ChevronDownIcon />} variant="outline" disabled={!hasNext} onClick={onNextImage} />
          </TooltipTrigger>
          <TooltipContent>{t('workspace.image-detail.next-image')}</TooltipContent>
        </Tooltip>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button icon={<TrashIcon />} variant="outline" onClick={onDeleteImage} />
        </TooltipTrigger>
        <TooltipContent>{t('workspace.image-detail.delete')}</TooltipContent>
      </Tooltip>
    </div>
  );
};
