import React from 'react';

import { isEmpty } from 'lodash';
import { Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { IPageType } from '@/apis/pages/typings.ts';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu.tsx';
import { SimpleInputDialog } from '@/components/ui/input/simple-input-dialog';

interface IPinViewProps extends React.ComponentPropsWithoutRef<'div'> {
  page: IPageType | null;
  pageId: string;
  pages?: IPageType[];
  setPages: (pages: IPageType[]) => Promise<void>;
}

export const PinView: React.FC<IPinViewProps> = ({ page, pages, pageId, setPages }) => {
  const { t } = useTranslation();

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

  return (
    <SimpleInputDialog
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
    </SimpleInputDialog>
  );
};
