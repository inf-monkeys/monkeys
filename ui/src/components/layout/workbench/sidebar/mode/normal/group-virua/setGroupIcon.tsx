import React, { useState } from 'react';

import { mutate } from 'swr';

import { RotateCcw, SmilePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useUpdateGroupPages } from '@/apis/pages';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu.tsx';
import { VinesIconSelector } from '@/components/ui/icon-selector';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ISetViewIconProps extends React.ComponentPropsWithoutRef<'div'> {
  groupId: string;
}

export const SetGroupIcon: React.FC<ISetViewIconProps> = ({ groupId }) => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const { trigger: updateGroupIcon } = useUpdateGroupPages(groupId);

  const handleSetGroupIcon = async (icon?: string) => {
    if (!groupId) return;
    toast.promise(
      updateGroupIcon({ iconUrl: icon }).then((result) => {
        // After successful update, also invalidate the useWorkspacePages cache
        mutate('/api/workflow/pages/pinned');
        setOpen(false);
        return result;
      }),
      {
        loading: t('common.save.loading'),
        success: t('common.save.success'),
        error: t('common.save.error'),
      },
    );
    // if (!pages) return;
    // const currentPage = pages.findIndex(({ id }) => id === pageId);
    // if (currentPage === -1) return;

    // const newPages = [...pages];
    // set(newPages[currentPage], 'customOptions.icon', icon);
    // toast.promise(setPages(newPages), {
    //   loading: t('common.save.loading'),
    //   success: t('common.save.success'),
    //   error: t('common.save.error'),
    //   finally: () => {
    //     setOpen(false);
    //     forceUpdate?.();
    //   },
    // });
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
                  void handleSetGroupIcon();
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
        <VinesIconSelector onIconSelect={handleSetGroupIcon} />
      </DialogContent>
    </Dialog>
  );
};
