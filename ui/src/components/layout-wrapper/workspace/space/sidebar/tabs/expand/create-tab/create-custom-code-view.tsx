import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { CodeSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { createWorkspacePage } from '@/apis/pages';
import { CreatePageDto } from '@/apis/pages/typings.ts';
import { useVinesPage } from '@/components/layout-wrapper/workspace/utils.ts';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu.tsx';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VinesIconEditor } from '@/components/ui/vines-icon/editor.tsx';
import { createCustomCodeViewSchema, ICreateCustomCodeView } from '@/schema/workspace/create-custom-code-view.ts';

interface ICreateCustomCodeViewProps extends React.ComponentPropsWithoutRef<'div'> {}

export const CreateCustomCodeView: React.FC<ICreateCustomCodeViewProps> = () => {
  const { t } = useTranslation();

  const { workflowId, pagesMutate, navigateTo } = useVinesPage();

  const [open, setOpen] = useState(false);

  const form = useForm<ICreateCustomCodeView>({
    resolver: zodResolver(createCustomCodeViewSchema),
    defaultValues: {
      displayName: '',
      icon: '🍀',
    },
  });

  const handleSubmit = form.handleSubmit(async ({ displayName, icon }) => {
    const newPages = await createWorkspacePage(workflowId, {
      type: 'api' as CreatePageDto.type,
      permissions: ['read', 'write', 'exec', 'permission'],
      displayName,
      customOptions: {
        icon,
      },
    });

    if (newPages) {
      await pagesMutate(newPages, { revalidate: false });
      const newPageId = newPages.at(-1)?.id;
      newPageId && (await navigateTo(newPageId));
    }

    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <DialogTrigger asChild>
          <TooltipTrigger asChild>
            <DropdownMenuItem
              className="flex items-center gap-2"
              onSelect={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <CodeSquare size={16} />
              {t('workspace.wrapper.space.add-tab.create-custom-code-view.button')}
            </DropdownMenuItem>
          </TooltipTrigger>
        </DialogTrigger>
        <TooltipContent className="w-52 space-y-1" side="left" sideOffset={8} align="start">
          <h1 className="text-sm font-bold">
            {t('workspace.wrapper.space.add-tab.create-custom-code-view.tips.title')}
          </h1>
          <p className="text-xs text-gray-12">
            {t('workspace.wrapper.space.add-tab.create-custom-code-view.tips.desc')}
          </p>
        </TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('workspace.wrapper.space.add-tab.create-custom-code-view.tips.title')}</DialogTitle>
          <DialogDescription>
            {t('workspace.wrapper.space.add-tab.create-custom-code-view.tips.desc')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <FormField
              name="displayName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('workspace.wrapper.space.add-tab.create-custom-code-view.form.display-name.label')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'workspace.wrapper.space.add-tab.create-custom-code-view.form.display-name.placeholder',
                      )}
                      {...field}
                      className="grow"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="icon"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('workspace.wrapper.space.add-tab.create-custom-code-view.form.icon')}</FormLabel>
                  <FormControl>
                    <VinesIconEditor value={field.value} onChange={field.onChange} onlyEmoji />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" variant="solid">
                {t('workspace.wrapper.space.add-tab.create-custom-code-view.form.submit')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
