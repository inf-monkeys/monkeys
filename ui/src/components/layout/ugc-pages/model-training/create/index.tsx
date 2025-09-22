import React, { useState } from 'react';

import { mutate } from 'swr';
import { useNavigate } from '@tanstack/react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { createModelTraining } from '@/apis/model-training';
import { IModelTraining } from '@/apis/model-training/typings';
import { IAssetItem } from '@/apis/ugc/typings.ts';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea.tsx';
import { createModelTrainingSchema, ICreateModelTraining } from '@/schema/workspace/create-model-training';

import { useGetUgcViewIconOnlyMode } from '../../util';

interface ICreateModelTrainingDialogProps {
  visible?: boolean;
  setVisible?: (visible: boolean) => void;
  afterCreate?: () => void;
}

export const CreateModelTrainingDialog: React.FC<ICreateModelTrainingDialogProps> = ({
  visible,
  setVisible,
  afterCreate,
}) => {
  const { t } = useTranslation();

  const [dialogOpen, setDialogOpen] = useState(false);

  const navigate = useNavigate();

  // 使用外部传入的visible状态，如果没有则使用内部状态
  const isOpen = visible !== undefined ? visible : dialogOpen;
  const setIsOpen = setVisible || setDialogOpen;

  const form = useForm<ICreateModelTraining>({
    resolver: zodResolver(createModelTrainingSchema),
    defaultValues: {
      displayName: t('common.utils.untitled') + t('common.type.model-training'),
    },
  });

  const mutateModelTrainings = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/model-training'));

  const { teamId } = useVinesTeam();

  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = form.handleSubmit((data) => {
    if (!teamId) {
      toast.warning(t('common.toast.loading'));
      return;
    }
    setIsCreating(true);
    toast.promise(
      async (): Promise<IAssetItem<IModelTraining>> => {
        const ModelTraining = await createModelTraining(data);
        if (!ModelTraining) throw new Error('model training created failed');
        return ModelTraining;
      },
      {
        success: (ModelTraining) => {
          // navigate({
          //   to: '/$teamId/model-training',
          // });
          setIsOpen(false);
          afterCreate?.(); // 调用回调函数
          return t('common.create.success');
        },
        loading: t('common.create.loading'),
        error: t('common.create.error'),
        finally: () => {
          setIsCreating(false);
          void mutateModelTrainings();
        },
      },
    );
  });

  const iconOnlyMode = useGetUgcViewIconOnlyMode();
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!visible && ( // 只有在没有外部控制时才显示触发器
        <DialogTrigger asChild>
          <Button variant="outline" size="small" icon={<Plus />}>
            {iconOnlyMode ? null : t('common.utils.create')}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t('ugc-page.model-training.create.dialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="m-1">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-global">
              <div className="flex flex-col gap-2">
                <FormLabel>{t('ugc-page.model-training.create.dialog.info.label')}</FormLabel>

                <div className="flex w-full items-center gap-3">
                  <FormField
                    name="displayName"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder={t('ugc-page.model-training.create.dialog.info.placeholder')}
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
                    <FormLabel>{t('ugc-page.model-training.create.dialog.description.label')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t('ugc-page.model-training.create.dialog.description.placeholder')}
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
                    setIsOpen(false);
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
