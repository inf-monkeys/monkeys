import React from 'react';

import { KeyedMutator } from 'swr/_internal';

import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { deleteWorkspacePage } from '@/apis/pages';
import { IPageType } from '@/apis/pages/typings.ts';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu.tsx';

interface IDeletePageProps extends React.ComponentPropsWithoutRef<'div'> {
  workflowId: string;
  page: IPageType | null;
  pageId: string;
  pagesMutate: KeyedMutator<IPageType[] | undefined>;
  navigateTo: (pageId: string) => Promise<void>;
}

export const DeletePage: React.FC<IDeletePageProps> = ({ workflowId, page, pageId, pagesMutate, navigateTo }) => {
  const { t } = useTranslation();

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

  return (
    <DropdownMenuItem className="flex items-center gap-2 text-red-10" onClick={handleDeletePage}>
      <Trash2 strokeWidth={1.5} size={16} />
      <p>{t('workspace.wrapper.space.menu.del-view-button')}</p>
    </DropdownMenuItem>
  );
};
