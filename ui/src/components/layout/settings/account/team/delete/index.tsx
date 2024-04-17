import React from 'react';

import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { deleteTeam, useTeams } from '@/apis/authz/team';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface IDeleteTeamProps extends React.ComponentPropsWithoutRef<'div'> {
  teamId?: string;
}

export const DeleteTeam: React.FC<IDeleteTeamProps> = ({ teamId }) => {
  const { mutate: mutateTeams } = useTeams();

  const handleDeleteTeam = () => {
    if (teamId) {
      toast('确定要删除该团队吗？', {
        action: {
          label: '确定',
          onClick: () =>
            toast('删除后，此团队内的所有资源将不可见！', {
              action: {
                label: '继续删除',
                onClick: () => {
                  toast.promise(deleteTeam(teamId), {
                    success: () => {
                      void mutateTeams();
                      return '团队已删除';
                    },
                    loading: '删除中......',
                    error: '删除失败，请检查网络是否通畅',
                  });
                },
              },
            }),
        },
      });
    } else {
      toast.error('团队信息不完整，操作失败');
    }
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
