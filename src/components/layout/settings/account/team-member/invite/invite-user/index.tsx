import React, { useState } from 'react';

import { useClipboard } from '@mantine/hooks';
import { ChevronDown, Inbox } from 'lucide-react';
import { toast } from 'sonner';

import { createTeamInviteLink, useTeamInvites } from '@/apis/authz/team';
import { ITeamInviteLinkOutdateType } from '@/apis/authz/team/typings.ts';
import { searchUsers } from '@/apis/authz/user';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { UserItem } from '@/components/layout/settings/account/team-member/invite/invite-user/user-item.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Input } from '@/components/ui/input.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Spinner } from '@/components/ui/spinner';
import { useLocalStorage } from '@/utils';

interface IInviteUserProps extends React.ComponentPropsWithoutRef<'div'> {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const InviteUser: React.FC<IInviteUserProps> = ({ visible, setVisible }) => {
  const [outdateType, setOutdateType] = useState<ITeamInviteLinkOutdateType>(ITeamInviteLinkOutdateType.SEVEN_DAYS);
  const [keywords, setKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHandleCreateInviteLink, setIsHandleCreateInviteLink] = useState(false);
  const [searchResult, setSearchResult] = useState<IVinesUser[]>([]);
  const { team } = useVinesTeam();
  const [currentUser] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});
  const clipboard = useClipboard();
  const { mutate: mutateInviteLinkList } = useTeamInvites(team?._id);

  const handleSearchUsers = async () => {
    if (!keywords) {
      toast.warning('请输入用户名或手机号');
      return;
    }
    if (keywords.length < 4) {
      toast.warning('请至少输入 4 位');
      return;
    }
    setSearchResult([]);
    setIsLoading(true);

    const users = await searchUsers(keywords);
    if (users) {
      setSearchResult(users);
      setIsLoading(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (team && team._id && currentUser._id) {
      setIsHandleCreateInviteLink(true);
      const teamId = team.id;
      const inviterUserId = currentUser?._id;
      toast.promise(
        createTeamInviteLink({
          teamId,
          inviterUserId,
          outdateType,
        }),
        {
          success: (link) => {
            void mutateInviteLinkList();
            clipboard.copy(link);
            return '链接复制成功';
          },
          error: '创建连接失败，请检查网络后重试',
          loading: '请求中......',
          finally: () => {
            setIsHandleCreateInviteLink(false);
          },
        },
      );
    } else {
      toast.warning('请等待加载完成后操作');
    }
  };

  return (
    <Dialog
      open={visible}
      onOpenChange={(v) => {
        if (!v) {
          setKeywords('');
          setSearchResult([]);
          setIsLoading(false);
        }
        void setVisible(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>邀请用户</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            placeholder="请输入用户名或手机号"
            value={keywords}
            onChange={setKeywords}
            onEnterPress={() => {
              void handleSearchUsers();
            }}
          />
          <Button loading={isLoading} onClick={() => handleSearchUsers()}>
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
            {searchResult.map((user) => (
              <UserItem key={user._id} user={user} outdateType={outdateType} teamId={team?._id} />
            ))}
          </div>
        </ScrollArea>
        <div className="flex items-center justify-between">
          <div className="mb-2">
            <h4 className="mb-2 flex items-center gap-2">
              <span>使用链接邀请</span>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="cursor-pointer border-b border-solid border-[var(--semi-color-border)]">
                    <span className="flex items-center gap-1">
                      <span className="w-16">
                        {outdateType === ITeamInviteLinkOutdateType.SEVEN_DAYS ? '7 天有效' : '永久有效'}
                      </span>
                      <ChevronDown size={15} />
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {[
                    { label: '7 天有效', onSelect: () => setOutdateType(ITeamInviteLinkOutdateType.SEVEN_DAYS) },
                    { label: '永久有效', onSelect: () => setOutdateType(ITeamInviteLinkOutdateType.NEVER) },
                  ].map((item, index) => (
                    <DropdownMenuItem key={index} onSelect={item.onSelect}>
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </h4>
            <div className="text-xs opacity-70">可以通过邀请链接成为团队成员</div>
          </div>

          <Button size="large" variant="solid" loading={isHandleCreateInviteLink} onClick={handleCopyInviteLink}>
            复制链接
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
