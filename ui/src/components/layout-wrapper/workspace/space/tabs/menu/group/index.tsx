import React, { useMemo } from 'react';

import { KeyedMutator } from 'swr/_internal';

import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCreatePageGroup, usePageGroups } from '@/apis/pages';
import { IPageType } from '@/apis/pages/typings.ts';
import { InfoEditor } from '@/components/layout/settings/account/info-editor.tsx';
import { GroupItem } from '@/components/layout-wrapper/workspace/space/tabs/menu/group/item.tsx';
import { DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.tsx';

interface IDropdownGroupProps extends React.ComponentPropsWithoutRef<'div'> {
  pageId: string;
  pinned?: boolean;
  handlePinPage?: (e: React.MouseEvent<HTMLDivElement>) => void;
  pagesMutate?: (data?: KeyedMutator<IPageType[] | undefined>) => void;
}

export const DropdownGroup: React.FC<IDropdownGroupProps> = ({ pageId, pinned, handlePinPage, pagesMutate }) => {
  const { t } = useTranslation();

  const { data, isLoading, mutate: pageGroupMutate } = usePageGroups();
  const { trigger: createPageGroupTrigger } = useCreatePageGroup();

  const handleCreateGroup = (displayName: string) => {
    toast.promise(createPageGroupTrigger({ displayName, pageId }), {
      loading: t('workspace.wrapper.space.menu.group.create-toast.loading'),
      success: (groups) => {
        pageGroupMutate(groups ?? [], { revalidate: false }).then(() => {
          setTimeout(() => pagesMutate?.(), 500);
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
    <>
      {isLoading && <DropdownMenuItem disabled>{t('common.load.loading')}</DropdownMenuItem>}
      {finalGroups?.map((group, i) => <GroupItem group={group} key={i} pageId={pageId} mutate={pageGroupMutate} />)}
      <DropdownMenuSeparator />
      <InfoEditor
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
      </InfoEditor>
    </>
  );
};
