import React from 'react';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IDeleteTeamProps extends React.ComponentPropsWithoutRef<'div'> {}

export const DeleteTeam: React.FC<IDeleteTeamProps> = () => {
  const handleDeleteTeam = () => {
    toast('确定要删除该团队吗？', {
      action: {
        label: '确定',
        onClick: () =>
          toast('删除后，此团队内的所有资源将不可见！', {
            action: {
              label: '继续删除',
              onClick: () => {
                toast.success('团队已删除');
              },
            },
          }),
      },
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="small" theme="danger" icon={<Trash2 />} onClick={handleDeleteTeam} />
      </TooltipTrigger>
      <TooltipContent>删除团队</TooltipContent>
    </Tooltip>
  );
};
