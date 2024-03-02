import React, { useState } from 'react';

import { HelpCircle, Inbox } from 'lucide-react';
import { toast } from 'sonner';

import { useTeams, useUpdateApplyTeam } from '@/apis/authz/team';
import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tooltip } from '@/components/ui/tooltip';

interface Props {
  open: boolean;
  onClose: () => void;
  team?: IVinesTeam | null;
}

export const JoinApplyMangeTeamDialog: React.FC<Props> = ({ open, onClose, team }) => {
  const [applyList, setApplyList] = useState<IVinesUser[]>([]);
  const [publicTeam, togglePublicTeam] = useState<boolean>();
  const [isHandleAccept, setIsHandleAccept] = useState<boolean>(false);

  const { mutate: teamsMutate } = useTeams();
  const { trigger: updateApplyTeamTrigger } = useUpdateApplyTeam(team?.id ?? '');

  async function handleAccept(userId: string, accept: boolean) {
    if (team) {
      toast.promise(
        updateApplyTeamTrigger({ applyUserId: userId, apply: accept }).then(() => {
          teamsMutate();
        }),
        {
          success: `已${accept ? '同意' : '拒绝'}加入团队`,
          loading: '操作中......',
          error: '操作失败',
        },
      );
    }
  }

  async function handleChangeDisable() {
    if (team) {
      toast.promise(updateApplyTeamTrigger({ disabled: publicTeam }), {
        success: '更新成功',
        loading: '更新中......',
        error: '更新失败',
      });
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <DialogTitle></DialogTitle>
        <div className="flex flex-col gap-4">
          <div className="h-96 w-full overflow-y-auto border-none">
            {!applyList.length && (
              <div className="mb-4 flex h-80 w-full flex-col items-center justify-center">
                <Inbox className="mb-2" size={24} />
                <p>暂无加入申请</p>
              </div>
            )}
            {/*{applyList.map(({ _id, name, photo }: IUser) => (*/}
            {/*  <div key={_id} className="bg-bg2 mb-4 flex items-center justify-between gap-4 rounded-md p-3">*/}
            {/*    <div className="flex items-center gap-4">*/}
            {/*      <Avatar className="size-9">*/}
            {/*        <AvatarImage className="aspect-auto" src={photo} alt={name} />*/}
            {/*        <AvatarFallback className="rounded-none p-2 text-xs">*/}
            {/*          {(name ?? 'AI').substring(0, 2)}*/}
            {/*        </AvatarFallback>*/}
            {/*      </Avatar>*/}
            {/*      <div>*/}
            {/*        <h1 className="text-sm">{name}</h1>*/}
            {/*      </div>*/}
            {/*    </div>*/}
            {/*    <div className="flex gap-2">*/}
            {/*      <Button disabled={isHandleAccept} theme="danger" onClick={() => handleAccept(_id, false)}>*/}
            {/*        拒绝*/}
            {/*      </Button>*/}
            {/*      <Button disabled={isHandleAccept} onClick={() => handleAccept(_id, true)}>*/}
            {/*        同意*/}
            {/*      </Button>*/}
            {/*    </div>*/}
            {/*  </div>*/}
            {/*))}*/}
          </div>
          <div className="flex justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-sm">设为公开团队</h1>
              <Tooltip
                content={
                  <div>
                    <div>开启时，当前团队会在平台公开，任何用户都可以搜索到并申请加入。</div>
                    <div>
                      关闭时，未加入团队的用户无法搜索到当前团队，也无法主动申请加入团队，但仍可通过邀请链接加入。
                    </div>
                  </div>
                }
              >
                <HelpCircle size={14} className="cursor-pointer" />
              </Tooltip>
            </div>
            <Switch checked={publicTeam} onCheckedChange={handleChangeDisable} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
