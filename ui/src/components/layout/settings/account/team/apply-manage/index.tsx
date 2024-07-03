import React, { useState } from 'react';

import { Inbox, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateTeamApply, useTeamJoinRequests, useTeamUsers } from '@/apis/authz/team';
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
  const { t } = useTranslation();

  const { data: applyListData, mutate: mutateApplyList, isLoading } = useTeamJoinRequests(teamId);
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
          success: t('settings.account.team.apply-manage.public-change.index', {
            operate: teamPublic
              ? t('settings.account.team.apply-manage.public-change.public')
              : t('settings.account.team.apply-manage.public-change.private'),
          }),
          loading: t('common.operate.loading'),
          error: t('common.operate.error'),
          finally: () => {
            void mutateApplyList();
            setIsHandleTeamPublicChange(false);
          },
        },
      );
    } else {
      toast.warning(t('common.toast.loading'));
    }
  };

  return (
    <Dialog onOpenChange={(v) => v && handleInit()}>
      <DialogTrigger asChild>
        <Button icon={<Inbox />} size="small" className="hidden" variant="outline">
          {t('settings.account.team.apply-manage.button')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.account.team.apply-manage.title')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-72">
          {(!applyListData || !applyListData.applyUserList || applyListData.applyUserList.length === 0) && (
            <div className="mb-4 flex h-64 w-full flex-col items-center justify-center">
              {isLoading ? (
                <Spinner />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Inbox size={24} />
                  <p>{t('common.load.empty')}</p>
                </div>
              )}
            </div>
          )}
          {applyListData?.applyUserList && (
            <div className="flex flex-col gap-2">
              {applyListData.applyUserList.map((user) => (
                <ApplyItem key={user.id} user={user} teamId={teamId} afterOperate={handleAfterOperate} />
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="flex justify-between">
          <Tooltip
            content={
              <div className="max-w-48">
                {t('settings.account.team.apply-manage.public-tooltip-1')}
                <br />
                {t('settings.account.team.apply-manage.public-tooltip-2')}
              </div>
            }
          >
            <div className="flex cursor-pointer items-center gap-2">
              <span>{t('settings.account.team.apply-manage.public-span')}</span>
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
