import React, { useState } from 'react';

import { Inbox, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { makeJoinTeamRequest, searchTeams, useTeams } from '@/apis/authz/team';
import { IVinesTeam } from '@/apis/authz/team/typings.ts';
import { JoinPublicTeamItem } from '@/components/layout/settings/account/team/join-public-team/team-item.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Spinner } from '@/components/ui/spinner';
import { Tooltip } from '@/components/ui/tooltip';

interface IJoinPublicTeamProps extends React.ComponentPropsWithoutRef<'div'> {}

export const JoinPublicTeam: React.FC<IJoinPublicTeamProps> = () => {
  const { t } = useTranslation();

  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHandleAccept, setIsHandleAccept] = useState<boolean>(false);
  const [keywords, setKeywords] = useState('');
  const [searchResult, setSearchResult] = useState<IVinesTeam[]>([]);

  const { data: userTeams } = useTeams();

  async function handleApplyTeam(teamId: string) {
    setIsHandleAccept(true);
    if (userTeams) {
      toast.promise(makeJoinTeamRequest(teamId), {
        success: () => {
          setVisible(false);
          return t('common.operate.success');
        },
        loading: t('common.operate.loading'),
        error: t('common.operate.error'),
      });
    } else {
      toast.warning(t('common.toast.loading'));
    }
    setIsHandleAccept(false);
  }

  async function handleSearchTeams(teams?: IVinesTeam[]) {
    setSearchResult([]);
    setIsLoading(true);

    const isTeams = await searchTeams(keywords);
    if (!isTeams) return;
    // 过滤已加入的团队
    const userTeamIds = (teams || userTeams || []).map((v: IVinesTeam) => v.id);
    const newTeams = isTeams.filter((v: IVinesTeam) => !userTeamIds.includes(v.id));
    setSearchResult(newTeams);

    setIsLoading(false);
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(v) => {
        v && void handleSearchTeams();
        !v && setKeywords('');
        setVisible(v);
      }}
    >
      <Tooltip content={t('settings.account.team.join-public-team.button-tooltip')}>
        <DialogTrigger asChild>
          <Button icon={<PlusCircle size={18} />} size="small" className="hidden" />
        </DialogTrigger>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.account.team.join-public-team.title')}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            placeholder={t('settings.account.team.join-public-team.search-placeholder')}
            value={keywords}
            onChange={setKeywords}
            onEnterPress={() => {
              void handleSearchTeams();
            }}
          />
          <Button loading={isLoading} onClick={() => handleSearchTeams()}>
            {t('common.utils.search')}
          </Button>
        </div>
        <ScrollArea className="h-72">
          {!searchResult.length && (
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
          <div className="flex flex-col gap-2">
            {searchResult.map((team: IVinesTeam) => (
              <JoinPublicTeamItem
                key={team.id}
                team={team}
                isHandleAccept={isHandleAccept}
                handleApplyTeam={handleApplyTeam}
              />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
