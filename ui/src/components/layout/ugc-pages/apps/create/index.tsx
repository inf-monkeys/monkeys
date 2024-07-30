import React, { useState } from 'react';

import { mutate } from 'swr';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea.tsx';
import { VinesIcon } from '@/components/ui/vines-icon';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { useWorkflow } from '@/package/vines-flow';
import { createWorkflowSchema, ICreateWorkflowInfo } from '@/schema/workspace/create-workflow.ts';
import { cn } from '@/utils';

type ICreateAppType = 'agent' | 'workflow';

export interface ICreateAppDialogProps {
  defaultSelect: ICreateAppType;
}

const AppTypeItem: React.FC<{
  type: ICreateAppType;
  selected: boolean;
  onSelect: (type: ICreateAppType) => void | Promise<void>;
}> = ({ type, selected, onSelect }) => {
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'flex-1 cursor-pointer rounded-md p-4 outline transition-all [&_*]:transition-all',
        selected
          ? 'outline-[3px] outline-[--tw-ring-color] ring-vines-500'
          : 'outline-[2px] outline-[hsl(var(--border))]',
      )}
      onClick={() => onSelect(type)}
    >
      <div className="flex gap-3">
        <div>
          <VinesIcon src={type === 'agent' ? 'lucide:bot:#ceefc5' : 'lucide:server:#ceefc5'} size="md" />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex w-full items-center justify-between">
            <span className="text-base">{t(`ugc-page.app.create.dialog.type.${type}.label`)}</span>
            <span
              className={cn(
                'button-theme-primary rounded-md px-2 py-1 text-xs',
                selected ? 'bg-[--bg-color] text-white' : 'outline outline-[1px] outline-[hsl(var(--border))]',
              )}
            >
              {t(`ugc-page.app.create.dialog.type.${type}.tag`)}
            </span>
          </div>
          <ul className="list-disc space-y-1 pl-5">
            {(t(`ugc-page.app.create.dialog.type.${type}.descriptions`, { returnObjects: true }) as string[]).map(
              (desc, index) => (
                <li className="text-xs opacity-65 " key={index}>
                  {desc}
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

const AppTypeSelector: React.FC<{
  selectedType: ICreateAppType;
  onChange: (selected: ICreateAppType) => void | Promise<void>;
}> = ({ selectedType, onChange }) => {
  return (
    <div className="flex justify-between gap-4">
      <AppTypeItem type="agent" selected={selectedType === 'agent'} onSelect={onChange} />
      <AppTypeItem type="workflow" selected={selectedType === 'workflow'} onSelect={onChange} />
    </div>
  );
};

const WorkflowCreateForm: React.FC<{
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = ({ setOpen }) => {
  const { t } = useTranslation();

  const { createWorkflow } = useWorkflow();

  const form = useForm<ICreateWorkflowInfo>({
    resolver: zodResolver(createWorkflowSchema),
    defaultValues: {
      displayName: t('common.utils.untitled'),
      description: '',
      iconUrl: 'emoji:🍀:#ceefc5',
    },
  });

  const mutateWorkflows = () => mutate((key) => typeof key === 'string' && key.startsWith('/api/workflow/metadata'));

  const { teamId } = useVinesTeam();

  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = form.handleSubmit((data) => {
    if (!teamId) {
      toast.warning(t('common.toast.loading'));
      return;
    }
    setIsCreating(true);
    toast.promise(
      async (): Promise<string> => {
        const workflowId = await createWorkflow(data);
        if (!workflowId) throw new Error('workflow created failed');
        return workflowId;
      },
      {
        success: (workflowId) => {
          open(`/${teamId}/workspace/${workflowId}`, '_blank');
          setOpen(false);
          return t('common.create.success');
        },
        loading: t('common.create.loading'),
        error: t('common.create.error'),
        finally: () => {
          setIsCreating(false);
          void mutateWorkflows();
        },
      },
    );
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <FormLabel>{t('ugc-page.app.create.dialog.info.label')}</FormLabel>

          <div className="flex w-full items-center gap-3">
            <FormField
              name="iconUrl"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <VinesIconEditor value={field.value} onChange={field.onChange} size="md" />
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
                      placeholder={t('ugc-page.app.create.dialog.info.placeholder')}
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
              <FormLabel>{t('ugc-page.app.create.dialog.description.label')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('ugc-page.app.create.dialog.description.placeholder')}
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
              setOpen(false);
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
  );
};

export const CreateAppDialog: React.FC<ICreateAppDialogProps> = ({ defaultSelect }) => {
  const { t } = useTranslation();

  const [selectedType, setSelectedType] = useState<ICreateAppType>(defaultSelect);

  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="small" icon={<Plus />}>
          {t('common.utils.create')}
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[1200px]" style={{ transition: 'height 0.5s ease' }}>
        <DialogHeader>
          <DialogTitle>{t('ugc-page.app.create.dialog.title')}</DialogTitle>
        </DialogHeader>
        <div className="m-1 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">{t('ugc-page.app.create.dialog.type.label')}</span>
            <AppTypeSelector selectedType={selectedType} onChange={setSelectedType} />
          </div>
          {selectedType === 'workflow' && <WorkflowCreateForm setOpen={setOpen} />}
        </div>
      </DialogContent>
    </Dialog>
  );
};
