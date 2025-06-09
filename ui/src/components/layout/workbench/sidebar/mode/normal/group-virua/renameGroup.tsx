import React from 'react';

import { mutate } from 'swr';

import { isEmpty } from 'lodash';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { usePageGroups, useUpdateGroupPages } from '@/apis/pages';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu.tsx';
import { SimpleDisplayNameDialog } from '@/components/ui/input/simple-display-name-dialog';
import { getI18nContent } from '@/utils';

interface IRenameViewProps extends React.ComponentPropsWithoutRef<'div'> {
  groupId: string;
}

export const RenameGroup: React.FC<IRenameViewProps> = ({ groupId }) => {
  const { t } = useTranslation();
  const { data: groups, mutate: mutateGroups } = usePageGroups();
  const { trigger } = useUpdateGroupPages(groupId);

  const currentGroup = groups?.find((group) => group.id === groupId);

  const handleRenameGroup = async (displayName: string | Record<string, string>) => {
    if (!groupId || !groups) return;

    // 直接使用 i18n 格式发送给后端
    const optimisticGroups = groups.map((group) => (group.id === groupId ? { ...group, displayName } : group));

    toast.promise(
      mutateGroups(
        trigger({ displayName }).then((result) => {
          // After successful update, also invalidate the useWorkspacePages cache
          mutate('/api/workflow/pages/pinned');
          return result ?? optimisticGroups;
        }),
        {
          optimisticData: optimisticGroups,
          revalidate: true,
        },
      ),
      {
        loading: t('common.save.loading'),
        success: t('common.save.success'),
        error: t('common.save.error'),
      },
    );
  };

  return (
    <SimpleDisplayNameDialog
      title={t('workspace.wrapper.space.menu.rename.title')}
      placeholder={getI18nContent(currentGroup?.displayName) ?? t('workspace.wrapper.space.menu.rename.placeholder')}
      initialValue={currentGroup?.displayName ?? ''}
      onFinished={(val) => {
        const currentDisplayName = getI18nContent(val);
        if (isEmpty(currentDisplayName)) {
          toast.error(t('workspace.wrapper.space.menu.rename.input-empty'));
          return;
        } else if (JSON.stringify(val) !== JSON.stringify(currentGroup?.displayName)) {
          void handleRenameGroup(val);
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
    </SimpleDisplayNameDialog>
  );
};
