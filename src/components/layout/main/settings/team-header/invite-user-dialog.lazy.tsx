import React, { useRef, useState } from 'react';

import { useClipboard } from '@mantine/hooks';
import { ChevronDown, Link } from 'lucide-react';
import { toast } from 'sonner';

import { useSearchUsers } from '@/apis/authz';
import { useCreateTeamInviteLink } from '@/apis/authz/team';
import { IVinesTeam, TeamInviteLinkOutdateType } from '@/apis/authz/team/typings.ts';
import { IVinesUser } from '@/apis/authz/user/typings.ts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { Input } from '@/components/ui/input.tsx';
import { useLocalStorage } from '@/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  team?: IVinesTeam | null;
}

export const InviteUserDialog: React.FC<Props> = ({ team, open, onClose }) => {
  const [user] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});
  const [keywords, setKeywords] = useState('');
  const [inviteLinkTime, setInviteLinkTime] = useState<'7days' | 'longtimes'>('7days');
  const { trigger: createInvitelLinkTrigger } = useCreateTeamInviteLink(team?.id ?? '');

  const copyTextRef = useRef<string>('');

  const { trigger: searchUsersTrigger, data: searchResult } = useSearchUsers();

  const { copy: clipboardCopy } = useClipboard();
  const copy = (text: string) => {
    void clipboardCopy(text);
    copyTextRef.current = text;
  };

  async function handleCopyInviteLink(targetUserId?: string) {
    if (!team?.id) return;
    toast.promise(
      createInvitelLinkTrigger({
        inviterUserId: user._id ?? '',
        inviteLinkTime:
          inviteLinkTime === '7days' ? TeamInviteLinkOutdateType.SEVEN_DAYS : TeamInviteLinkOutdateType.NEVER,
        targetUserId,
      }).then((r: any) => {
        if (r.r.code != 200 || !r.r.data) throw new Error('请求失败');
        copy(r.r.data as string);
      }),
      {
        success: '已复制邀请链接',
        loading: '请求中......',
        error: '邀请链接生成失败',
      },
    );
  }

  async function handleSearchUsers() {
    if (!keywords) {
      toast.warning('请输入用户名或手机号');
      return;
    }
    if (keywords.length < 4) {
      toast.warning('请至少输入 4 位');
      return;
    }
    toast.promise(
      searchUsersTrigger({
        keyword: keywords,
      }),
      {
        success: '搜索成功',
        loading: '搜索中......',
        error: '搜索失败',
      },
    );
  }

  return (
    <Dialog open={open && !!team} onClose={onClose}>
      <DialogContent>
        <DialogTitle>邀请成员</DialogTitle>
        <div className="flex gap-2">
          <Input placeholder="请输入用户名或手机号" value={keywords} onChange={setKeywords} />
          <Button onClick={handleSearchUsers}>搜索</Button>
        </div>

        <div className="my-4 h-80 w-full overflow-y-auto">
          <div className="flex h-full w-full flex-col gap-4">
            {!searchResult || searchResult.length === 0 ? (
              <div className="text-center">空空如也</div>
            ) : (
              searchResult.map((resultUser) => (
                <div
                  className="hover:bg-bg2 flex items-center justify-between rounded-md p-2 text-xs transition-all"
                  key={resultUser.id}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="size-4">
                      <AvatarImage className="aspect-auto" src={resultUser.photo} alt={resultUser.name} />
                      <AvatarFallback className="rounded-none p-2 text-xs">
                        {(resultUser.name ?? 'AI').substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-1">{resultUser.name}</div>
                    {user._id === resultUser._id ? (
                      <div className="scale-75 rounded-md bg-[var(--semi-color-primary)] p-1 font-bold leading-none">
                        我
                      </div>
                    ) : null}
                  </div>

                  {user._id === resultUser._id ? (
                    <div className="cursor-not-allowed opacity-70">复制链接</div>
                  ) : (
                    <div
                      className="cursor-pointer text-[var(--semi-color-primary)] transition-all hover:opacity-75"
                      onClick={() => handleCopyInviteLink(user._id)}
                    >
                      复制链接
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="mb-2">
            <h4 className="mb-2 flex items-center gap-2">
              <Link size={16} />
              <span>使用链接邀请</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex cursor-pointer items-center gap-1 border-b border-solid border-[var(--semi-color-border)]">
                    <span>{inviteLinkTime === '7days' ? '7 天有效' : '永久有效'}</span>
                    <ChevronDown size={16} />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {[
                    { node: 'item', name: '7 天有效', onClick: () => setInviteLinkTime('7days') },
                    { node: 'item', name: '永久有效', onClick: () => setInviteLinkTime('longtimes') },
                  ].map(({ name, onClick }, index) => (
                    <DropdownMenuItem key={index} onSelect={onClick}>
                      {name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </h4>
            <div className="text-xs opacity-70">可以通过邀请链接成为团队成员</div>
          </div>

          <Button size="large" onClick={() => handleCopyInviteLink()}>
            复制链接
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
