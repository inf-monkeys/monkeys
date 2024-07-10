import React, { useState } from 'react';

import { useForceUpdate } from '@mantine/hooks';
import { DialogTrigger } from '@radix-ui/react-dialog';
import { get, isEmpty } from 'lodash';
import { MoreVertical, Pencil, Star, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteWorkspacePage, toggleWorkspacePagePin } from '@/apis/pages';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils';

interface ITabMenuProps extends React.ComponentPropsWithoutRef<'div'> {}

export const TabMenu: React.FC<ITabMenuProps> = () => {
  const { t } = useTranslation();

  const { workflowId, page, pages, pageId, navigateTo, pagesMutate, setPages } = useVinesPage();

  const [toggleNameDialogVisible, setToggleNameDialogVisible] = useState(false);
  const [pageDisplayName, setPageDisplayName] = useState(page?.displayName ?? '');

  const forceUpdate = useForceUpdate();

  const handleDeletePage = async () => {
    toast(
      t('workspace.wrapper.space.menu.del-view', {
        view: page?.displayName ?? t('workspace.wrapper.space.unknown-view'),
      }),
      {
        action: {
          label: t('common.utils.confirm'),
          onClick: async () => {
            const newPages = await deleteWorkspacePage(workflowId, pageId);

            if (newPages) {
              await pagesMutate(newPages, { revalidate: false });
              const newPageId = newPages.at(-1)?.id;
              if (newPageId) {
                await navigateTo(newPageId);
              }
            }
          },
        },
      },
    );
  };

  const handleRenamePage = async () => {
    if (!pages) return;
    const currentPage = pages.findIndex(({ id }) => id === pageId);
    if (currentPage === -1) return;

    const newPages = [...pages];
    newPages[currentPage].displayName = pageDisplayName;
    toast.promise(setPages(newPages), {
      loading: t('common.save.loading'),
      success: t('common.save.success'),
      error: t('common.save.error'),
    });
  };

  const isPin = get(page, 'pinned', false);

  const handlePinPage = async (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!pages) return;
    const currentPage = pages.findIndex(({ id }) => id === pageId);
    if (currentPage === -1) return;

    const newPin = !isPin;
    const pinStatus = isPin ? t('workspace.wrapper.space.menu.pin-un') : '';
    toast.promise(toggleWorkspacePagePin(pageId, newPin), {
      loading: t('workspace.wrapper.space.menu.toggle-pin', {
        status: pinStatus,
      }),
      success: () => {
        const newPages = [...pages];
        newPages[currentPage].pinned = newPin;
        void setPages(newPages);
        forceUpdate();
        return t('workspace.wrapper.space.menu.toggle-pin-success', {
          status: pinStatus,
        });
      },
      error: t('workspace.wrapper.space.menu.toggle-pin-failed', {
        status: pinStatus,
      }),
    });
  };

  return (
    <Dialog open={toggleNameDialogVisible} onOpenChange={setToggleNameDialogVisible}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="!scale-80 [&_svg]:stroke-gold-12" icon={<MoreVertical />} variant="borderless" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DialogTrigger asChild>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => setPageDisplayName(page?.displayName ?? '')}
              >
                <Pencil strokeWidth={1.5} size={16} />
                <p>{t('workspace.wrapper.space.menu.rename.trigger')}</p>
              </DropdownMenuItem>
            </DialogTrigger>
            <DropdownMenuItem
              className={cn('flex items-center gap-2', isPin && 'text-yellow-9')}
              onClick={handlePinPage}
            >
              <Star
                className={cn(isPin && '[&_polygon]:fill-yellow-9 [&_polygon]:stroke-yellow-9')}
                strokeWidth={1.5}
                size={16}
              />
              <p>
                {t('workspace.wrapper.space.menu.pin', {
                  status: isPin ? t('workspace.wrapper.space.menu.pin-un') : '',
                })}
              </p>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 text-red-10"
              disabled={page?.type === 'process'}
              onClick={handleDeletePage}
            >
              <Trash2 strokeWidth={1.5} size={16} />
              <p>{t('workspace.wrapper.space.menu.del-view-button')}</p>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('workspace.wrapper.space.menu.rename.title')}</DialogTitle>
        </DialogHeader>
        <div className="gap-4 py-4">
          <Input
            placeholder={page?.displayName ?? t('workspace.wrapper.space.menu.rename.placeholder')}
            maxLength={16}
            value={pageDisplayName}
            onChange={setPageDisplayName}
          />
        </div>
        <DialogFooter>
          <Button
            variant="solid"
            onClick={() => {
              if (isEmpty(pageDisplayName)) {
                toast.error(t('workspace.wrapper.space.menu.rename.input-empty'));
                return;
              } else if (pageDisplayName !== page?.displayName) {
                void handleRenamePage();
              }
              setToggleNameDialogVisible(false);
            }}
          >
            {t('workspace.wrapper.space.menu.rename.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
