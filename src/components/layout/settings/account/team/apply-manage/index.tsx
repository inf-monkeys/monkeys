import React, { useState } from 'react';

import { Inbox, Info } from 'lucide-react';
import { toast } from 'sonner';

import { updateTeamApply, useTeamApplyList, useTeamUsers } from '@/apis/authz/team';
import { ApplyItem } from '@/components/layout/settings/account/team/apply-manage/apply-item.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Tooltip } from '@/components/ui/tooltip';

interface IApplyManageProps extends React.ComponentPropsWithoutRef<'div'> {
  teamId?: string;
}

export const ApplyManage: React.FC<IApplyManageProps> = ({ teamId }) => {
  const { data: applyListData, mutate: mutateApplyList, isLoading } = useTeamApplyList(teamId);
  const { mutate: mutateTeamUsers } = useTeamUsers(teamId);
  const [isHandleTeamPublicChange, setIsHandleTeamPublicChange] = useState(false);

  const handleInit = async () => {
    void mutateApplyList();
  };

  const handleAfterOperate = () => {
    void mutateTeamUsers();
    void mutateApplyList();
  };

  const handleTeamPublicChange = (teamPublic: boolean) => {
    if (teamId) {
      setIsHandleTeamPublicChange(true);
      toast.promise(
        updateTeamApply({
          teamId,
          disabled: !teamPublic,
        }),
        {
          success: `已${teamPublic ? '公开' : '私有'}该团队`,
          loading: '操作中......',
          error: '操作失败，请检查网络后重试',
          finally: () => {
            void mutateApplyList();
            setIsHandleTeamPublicChange(false);
          },
        },
      );
    } else {
      toast.warning('请等待加载完毕');
    }
  };

  return (
    <Dialog onOpenChange={(v) => v && handleInit()}>
      <DialogTrigger asChild>
        <Button icon={<Inbox />} size="small">
          申请管理
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>申请管理</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-72">
          {(!applyListData || !applyListData.applyUserList || applyListData.applyUserList.length === 0) && (
            <div className="mb-4 flex h-64 w-full flex-col items-center justify-center">
              {isLoading ? (
                <Spinner />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Inbox size={24} />
                  <p>暂无申请</p>
                </div>
              )}
            </div>
          )}
          {applyListData?.applyUserList && (
            <div className="flex flex-col gap-2">
              {applyListData.applyUserList.map((user) => (
                <ApplyItem key={user._id} user={user} teamId={teamId} afterOperate={handleAfterOperate} />
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="flex justify-between">
          <Tooltip
            content={
              <div className="max-w-48">
                开启时，当前团队会在平台公开，任何用户都可以搜索到并申请加入。
                <br />
                关闭时，未加入团队的用户无法搜索到当前团队，也无法主动申请加入团队，但仍可通过邀请链接加入。
              </div>
            }
          >
            <div className="flex cursor-pointer items-center gap-2">
              <span>设为公开团队</span>
              <Info size={15} />
            </div>
          </Tooltip>
          <Switch
            loading={isHandleTeamPublicChange}
            checked={!applyListData?.disable}
            onCheckedChange={handleTeamPublicChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
