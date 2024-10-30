import React, { useMemo } from 'react';

import { KeyedMutator } from 'swr/_internal';

import { Pin, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCreatePageGroup, usePageGroups } from '@/apis/pages';
import { IPageType } from '@/apis/pages/typings.ts';
import { VirtuaPinGroupList } from '@/components/layout-wrapper/workspace/space/sidebar/tabs/menu/group/virtua';
import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { SimpleInputDialog } from '@/components/ui/input/simple-input-dialog';

interface IViewGroupProps extends React.ComponentPropsWithoutRef<'div'> {
  pageId: string;
  pagesMutate?: (data?: KeyedMutator<IPageType[] | undefined>) => void;
}

export const ViewGroup: React.FC<IViewGroupProps> = ({ pageId, pagesMutate }) => {
  const { t } = useTranslation();

  const { data, isLoading, mutate: pageGroupMutate } = usePageGroups();
  const { trigger: createPageGroupTrigger } = useCreatePageGroup();

  const handleCreateGroup = (displayName: string) => {
    toast.promise(createPageGroupTrigger({ displayName, pageId }), {
      loading: t('workspace.wrapper.space.menu.group.create-toast.loading'),
      success: (groups) => {
        pageGroupMutate(groups ?? [], { revalidate: false }).then(() => {
          if (pagesMutate) {
            setTimeout(() => pagesMutate(), 500);
          }
        });
        return t('workspace.wrapper.space.menu.group.create-toast.success');
      },
      error: t('workspace.wrapper.space.menu.group.create-toast.error'),
    });
  };

  const finalGroups = useMemo(() => {
    if (data) {
      const hasBuiltIn = data.some((group) => group.isBuiltIn);
      return hasBuiltIn
        ? data.sort((a) => (a.isBuiltIn ? -1 : 1))
        : [
            {
              id: 'default',
              displayName: t('workspace.wrapper.space.menu.group.def'),
              isBuiltIn: true,
              pageIds: [],
            },
            ...data,
          ];
    }
    return [];
  }, [data]);

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex items-center gap-2">
        <Pin strokeWidth={1.5} size={16} />
        {t('workspace.wrapper.space.menu.pin')}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {isLoading && <DropdownMenuItem disabled>{t('common.load.loading')}</DropdownMenuItem>}
          <VirtuaPinGroupList data={finalGroups} pageId={pageId} mutate={pageGroupMutate} />
          <DropdownMenuSeparator />
          <SimpleInputDialog
            title={t('workspace.wrapper.space.menu.group.create')}
            placeholder={t('workspace.wrapper.space.menu.group.placeholder')}
            onFinished={handleCreateGroup}
          >
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            >
              <Plus size={16} />
              {t('workspace.wrapper.space.menu.group.create')}
            </DropdownMenuItem>
          </SimpleInputDialog>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};
