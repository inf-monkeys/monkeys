import React, { memo } from 'react';

import { useForceUpdate } from '@mantine/hooks';
import { get, isEmpty } from 'lodash';
import { MoreVertical, Pencil, Pin, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteWorkspacePage, toggleWorkspacePagePin } from '@/apis/pages';
import { InfoEditor } from '@/components/layout/settings/account/info-editor.tsx';
import { DropdownGroup } from '@/components/layout-wrapper/workspace/space/tabs/menu/group';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';

interface ITabMenuProps extends React.ComponentPropsWithoutRef<'div'> {}

export const TabMenu: React.FC<ITabMenuProps> = memo(() => {
  const { t } = useTranslation();

  const { workflowId, page, pages, pageId, navigateTo, pagesMutate, setPages } = useVinesPage();

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

  const handleRenamePage = async (name: string) => {
    if (!pages) return;
    const currentPage = pages.findIndex(({ id }) => id === pageId);
    if (currentPage === -1) return;

    const newPages = [...pages];
    newPages[currentPage].displayName = name;
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="!scale-80 [&_svg]:stroke-gold-12" icon={<MoreVertical />} variant="borderless" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <InfoEditor
            title={t('workspace.wrapper.space.menu.rename.title')}
            placeholder={page?.displayName ?? t('workspace.wrapper.space.menu.rename.placeholder')}
            initialValue={page?.displayName ?? ''}
            onFinished={(val) => {
              if (isEmpty(val)) {
                toast.error(t('workspace.wrapper.space.menu.rename.input-empty'));
                return;
              } else if (val !== page?.displayName) {
                void handleRenamePage(val);
              }
            }}
          >
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <Pencil strokeWidth={1.5} size={16} />
              <p>{t('workspace.wrapper.space.menu.rename.trigger')}</p>
            </DropdownMenuItem>
          </InfoEditor>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <Pin strokeWidth={1.5} size={16} />
              {t('workspace.wrapper.space.menu.pin')}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownGroup pageId={pageId} pinned={isPin} handlePinPage={handlePinPage} pagesMutate={pagesMutate}/>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2 text-red-10" onClick={handleDeletePage}>
            <Trash2 strokeWidth={1.5} size={16} />
            <p>{t('workspace.wrapper.space.menu.del-view-button')}</p>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

TabMenu.displayName = 'TabMenu';
