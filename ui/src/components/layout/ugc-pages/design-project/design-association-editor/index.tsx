import React from 'react';

import { Link, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useGetDesignAssociationList } from '@/apis/designs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import VinesEvent from '@/utils/events';

import { useGetUgcViewIconOnlyMode } from '../../util';
import { DesignAssociationEditor } from './editor';
import { DesignAssociationEditorItem } from './item';

export const DesignAssociationEditorDialog: React.FC = () => {
  const { t } = useTranslation();

  const { data, mutate } = useGetDesignAssociationList();

  const iconOnlyMode = useGetUgcViewIconOnlyMode();

  return (
    <>
      <Dialog>
        <DialogContent className="flex h-[36rem] flex-col">
          <DialogTitle>{t('ugc-page.design-project.association-editor.title')}</DialogTitle>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
            {(data ?? []).map((item) => (
              <DesignAssociationEditorItem key={item.id} data={item} mutate={mutate} />
            ))}
            <Button
              variant="outline"
              icon={<Plus />}
              onClick={() => {
                VinesEvent.emit('design-association-editor', {}, 'create');
              }}
            >
              {t('ugc-page.design-project.association-editor.add')}
            </Button>
          </div>
          <DialogFooter></DialogFooter>
        </DialogContent>
        <DialogTrigger asChild>
          <Button variant="outline" size="small" icon={<Link />}>
            {iconOnlyMode ? null : t('common.utils.edit')}
          </Button>
        </DialogTrigger>
      </Dialog>
      <DesignAssociationEditor />
    </>
  );
};
