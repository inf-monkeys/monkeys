import React, { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { createTeam, useTeams } from '@/apis/authz/team';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import { createTeamSchema, ICreateTeam } from '@/schema/settings/team.ts';

interface ICreateTeamProps extends React.ComponentPropsWithoutRef<'div'> {}

export const CreateTeam: React.FC<ICreateTeamProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);

  const { mutate: mutateTeams } = useTeams();

  const form = useForm<ICreateTeam>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
      description: '',
      logoUrl: '',
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = form.handleSubmit(({ name, description, logoUrl }) => {
    setIsLoading(true);
    toast.promise(
      createTeam({
        name,
        description,
        logoUrl,
      }),
      {
        loading: '正在创建中...',
        success: (data) => {
          void mutateTeams();
          setIsLoading(false);
          setVisible(false);
          form.reset();
          return '创建成功！';
        },
        error: '创建失败，请检查网络是否通畅',
        finally: () => setIsLoading(false),
      },
    );
  });

  return (
    <Dialog open={visible} onOpenChange={setVisible}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建团队</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="flex flex-col gap-2 space-y-1.5" onSubmit={handleSubmit}>
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="请输入团队名称" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder="请输入团队描述" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" loading={isLoading} variant="solid">
              确定
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
