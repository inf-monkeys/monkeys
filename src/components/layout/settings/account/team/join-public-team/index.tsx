import React, { useState } from 'react';

import { Inbox, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

import { applyTeam, searchTeams, useTeams } from '@/apis/authz/team';
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
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHandleAccept, setIsHandleAccept] = useState<boolean>(false);
  const [keywords, setKeywords] = useState('');
  const [searchResult, setSearchResult] = useState<IVinesTeam[]>([]);

  const { data: userTeams } = useTeams();

  async function handleApplyTeam(teamId: string) {
    setIsHandleAccept(true);
    if (userTeams) {
      toast.promise(applyTeam(teamId), {
        success: () => {
          setVisible(false);
          return '申请成功';
        },
        loading: '申请中......',
        error: '申请错误，请检查网络后重试',
      });
    } else {
      toast.warning('正在加载中，请稍后再尝试');
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
      <Tooltip content="加入公开团队">
        <DialogTrigger asChild>
          <Button icon={<PlusCircle size={18} />} size="small" />
        </DialogTrigger>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>加入公开团队</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            placeholder="请输入团队名称"
            value={keywords}
            onChange={setKeywords}
            onEnterPress={() => {
              void handleSearchTeams();
            }}
          />
          <Button loading={isLoading} onClick={() => handleSearchTeams()}>
            搜索
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
                  <p>暂无搜索结果</p>
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
