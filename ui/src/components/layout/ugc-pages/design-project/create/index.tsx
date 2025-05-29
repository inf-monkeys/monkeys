import React, { useState } from 'react';

import { mutate } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createDesignProject } from '@/apis/designs';
import { IDesignProject } from '@/apis/designs/typings.ts';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea.tsx';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { DEFAULT_DESIGN_PROJECT_ICON_URL } from '@/consts/icons.ts';
import { createDesignProjectSchema, ICreateDesignProject } from '@/schema/workspace/create-design-project.ts';

export const CreateDesignProjectDialog: React.FC = () => {
  const { t } = useTranslation();

  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<ICreateDesignProject>({
    resolver: zodResolver(createDesignProjectSchema),
    defaultValues: {
      displayName: t('common.utils.untitled') + t('common.type.design-project'),
      description: '',
      iconUrl: DEFAULT_DESIGN_PROJECT_ICON_URL,
    },
  });

  const mutateDesignProjects = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/design/project'));

  const { teamId } = useVinesTeam();

  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = form.handleSubmit((data) => {
    if (!teamId) {
      toast.warning(t('common.toast.loading'));
      return;
    }
    setIsCreating(true);
    toast.promise(
      async (): Promise<IAssetItem<IDesignProject>> => {
        const designProject = await createDesignProject(data);
        if (!designProject) throw new Error('design project created failed');
        return designProject;
      },
      {
        success: (designProject) => {
          open(`/${teamId}/design/${designProject.id}`, '_blank');
          setDialogOpen(false);
          return t('common.create.success');
        },
        loading: t('common.create.loading'),
        error: t('common.create.error'),
        finally: () => {
          setIsCreating(false);
          void mutateDesignProjects();
        },
      },
    );
  });

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="small" icon={<Plus />}>
          {t('common.utils.create')}
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[1200px] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('ugc-page.design-project.create.dialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="m-1">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <FormLabel>{t('ugc-page.design-project.create.dialog.info.label')}</FormLabel>

                <div className="flex w-full items-center gap-3">
                  <FormField
                    name="iconUrl"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <VinesIconEditor
                            value={field.value ?? DEFAULT_DESIGN_PROJECT_ICON_URL}
                            onChange={field.onChange}
                            size="md"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="displayName"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder={t('ugc-page.design-project.create.dialog.info.placeholder')}
                            {...field}
                            className=""
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                name="description"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ugc-page.design-project.create.dialog.description.label')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('ugc-page.design-project.create.dialog.description.placeholder')}
                        className="h-28 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDialogOpen(false);
                  }}
                >
                  {t('common.utils.cancel')}
                </Button>
                <Button variant="solid" type="submit" loading={isCreating}>
                  {t('common.utils.create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
