import React from 'react';

import { isEmpty } from 'lodash';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { usePageGroups, useUpdateGroupPages } from '@/apis/pages';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu.tsx';
import { SimpleInputDialog } from '@/components/ui/input/simple-input-dialog';

interface IRenameViewProps extends React.ComponentPropsWithoutRef<'div'> {
  groupId: string;
}

export const RenameGroup: React.FC<IRenameViewProps> = ({ groupId }) => {
  const { t } = useTranslation();
  const { data: groups, mutate } = usePageGroups();
  const { trigger } = useUpdateGroupPages(groupId);

  const currentGroup = groups?.find((group) => group.id === groupId);

  const handleRenameGroup = async (displayName: string) => {
    if (!groupId || !groups) return;

    // Optimistic update
    const optimisticGroups = groups.map((group) => (group.id === groupId ? { ...group, displayName } : group));

    toast.promise(
      mutate(
        trigger({ displayName }).then((result) => {
          // Return the server response or fall back to optimistic data
          return result ?? optimisticGroups;
        }),
        {
          optimisticData: optimisticGroups,
          revalidate: false,
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
    <SimpleInputDialog
      title={t('workspace.wrapper.space.menu.rename.title')}
      placeholder={currentGroup?.displayName ?? t('workspace.wrapper.space.menu.rename.placeholder')}
      initialValue={currentGroup?.displayName ?? ''}
      onFinished={(val) => {
        if (isEmpty(val)) {
          toast.error(t('workspace.wrapper.space.menu.rename.input-empty'));
          return;
        } else if (val !== currentGroup?.displayName) {
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
    </SimpleInputDialog>
  );
};
