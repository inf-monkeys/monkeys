import React, { useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLatest } from 'ahooks';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createDesignAssociation, updateDesignAssociation } from '@/apis/designs';
import { IDesignAssociation } from '@/apis/designs/typings';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form.tsx';
import { DEFAULT_DESIGN_ASSOCIATION_LUCIDE_ICON_URL } from '@/consts/icons';
import { designAssociationSchema, IDesignAssociationForEditor } from '@/schema/workspace/design-association';
import VinesEvent from '@/utils/events.ts';

import { DesignAssociationEditorFields } from './field';

interface IDesignAssociationEditorProps {}

export const DesignAssociationEditor: React.FC<IDesignAssociationEditorProps> = () => {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);

  const { mutate } = useSWRConfig();

  const defaultValues = {
    enabled: true,
    displayName: '',
    description: '',
    iconUrl: DEFAULT_DESIGN_ASSOCIATION_LUCIDE_ICON_URL,
  };

  const form = useForm<IDesignAssociationForEditor>({
    resolver: zodResolver(designAssociationSchema),
    defaultValues,
  });

  const [aid, setAid] = useState<string | undefined>();

  const [mode, setMode] = useState<'create' | 'update'>('create');

  useEffect(() => {
    const handleOpen = (association: IDesignAssociation, mode: 'create' | 'update' = 'create') => {
      console.log('handleOpen', association, mode);
      setMode(mode);
      if (mode === 'update') {
        form.reset(association as IDesignAssociationForEditor);
        setAid(association.id);
      }
      if (mode === 'create') {
        form.reset(defaultValues);
        setAid(undefined);
        console.log('handleOpen', form.getValues());
      }
      setOpen(true);
    };
    VinesEvent.on('design-association-editor', handleOpen);
    return () => {
      VinesEvent.off('design-association-editor', handleOpen);
    };
  }, []);

  const handleSubmit = form.handleSubmit(
    (data) => {
      if (mode === 'update') {
        if (!aid) {
          toast.warning(t('common.toast.loading'));
          return;
        }
        toast.promise(updateDesignAssociation(aid, data), {
          loading: t('common.update.loading'),
          error: t('common.update.error'),
          success: () => {
            void mutate((key) => typeof key === 'string' && key.startsWith(`/api/design/association`));
            setAid(undefined);
            setMode('create');
            setOpen(false);
            form.reset(defaultValues);
            return t('common.update.success');
          },
        });
      }
      if (mode === 'create') {
        toast.promise(createDesignAssociation(data), {
          loading: t('common.create.loading'),
          error: t('common.create.error'),
          success: () => {
            void mutate((key) => typeof key === 'string' && key.startsWith(`/api/design/association`));
            setAid(undefined);
            setMode('create');
            setOpen(false);
            form.reset(defaultValues);
            return t('common.create.success');
          },
        });
      }
    },
    (errors) => {
      console.error('Form validation errors:', errors);
    },
  );

  const submitButtonRef = React.useRef<HTMLButtonElement>(null);

  const openLatest = useLatest(open);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="w-auto max-w-6xl"
        onPointerDownOutside={(e) => {
          if (e.target instanceof Element && e.target.closest('[data-sonner-toast]')) {
            e.preventDefault();
          }
          if ((e.target as HTMLDivElement).getAttribute('data-vines-overlay')) {
            setTimeout(() => {
              if (!openLatest.current) {
                submitButtonRef.current?.click();
              }
            });
          }
        }}
      >
        <DialogTitle>{t('ugc-page.design-project.association-editor.editor.title')}</DialogTitle>
        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
              }
            }}
          >
            <DesignAssociationEditorFields form={form} />
            <DialogFooter>
              <div className="flex items-center gap-2">
                <Button ref={submitButtonRef} type="submit" variant="outline">
                  {mode === 'create' ? t('common.utils.create') : t('common.utils.save')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
