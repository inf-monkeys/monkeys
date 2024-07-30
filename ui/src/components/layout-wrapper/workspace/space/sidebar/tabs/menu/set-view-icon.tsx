import React, { useState } from 'react';
import { set } from 'lodash';
import { RotateCcw, SmilePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { IPageType } from '@/apis/pages/typings.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu.tsx';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIconSelector } from '@/components/ui/icon-selector';

interface ISetViewIconProps extends React.ComponentPropsWithoutRef<'div'> {
  pageId: string;
  pages?: IPageType[];
  setPages: (pages: IPageType[]) => Promise<void>;
  forceUpdate?: React.DispatchWithoutAction;
}

export const SetViewIcon: React.FC<ISetViewIconProps> = ({ pageId, pages, setPages, forceUpdate }) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  const handleSetViewIcon = async (icon?: string) => {
    if (!pages) return;
    const currentPage = pages.findIndex(({ id }) => id === pageId);
    if (currentPage === -1) return;

    const newPages = [...pages];
    set(newPages[currentPage], 'customOptions.icon', icon);
    toast.promise(setPages(newPages), {
      loading: t('common.save.loading'),
      success: t('common.save.success'),
      error: t('common.save.error'),
      finally: () => {
        setOpen(false);
        forceUpdate?.();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem
          className="flex items-center justify-between gap-4"
          onSelect={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <div className="flex items-center gap-2">
            <SmilePlus strokeWidth={1.5} size={16} />
            <p>{t('workspace.wrapper.space.menu.set-icon.trigger')}</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="-m-2 scale-[0.6]"
                icon={<RotateCcw />}
                size="small"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  void handleSetViewIcon();
                }}
              />
            </TooltipTrigger>
            <TooltipContent>{t('workspace.wrapper.space.menu.set-icon.reset')}</TooltipContent>
          </Tooltip>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="w-auto">
        <DialogHeader>
          <DialogTitle>{t('workspace.wrapper.space.menu.set-icon.title')}</DialogTitle>
        </DialogHeader>
        <VinesIconSelector onIconSelect={handleSetViewIcon} />
      </DialogContent>
    </Dialog>
  );
};
