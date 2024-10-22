import React, { useState } from 'react';

import { ChevronDown, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Spinner } from '@/components/ui/spinner';
import { useCopy } from '@/hooks/use-copy.ts';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface IInviteUserProps extends React.ComponentPropsWithoutRef<'div'> {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export const InviteUser: React.FC<IInviteUserProps> = ({ visible, setVisible }) => {
  const { t } = useTranslation();

  const [outdateType, setOutdateType] = useState<ITeamInviteLinkOutdateType>(ITeamInviteLinkOutdateType.SEVEN_DAYS);
  const [keywords, setKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHandleCreateInviteLink, setIsHandleCreateInviteLink] = useState(false);
  const [searchResult, setSearchResult] = useState<IVinesUser[]>([]);
  const { team } = useVinesTeam();
  const [currentUser] = useLocalStorage<Partial<IVinesUser>>('vines-account', {});
  const { copy } = useCopy();
  const { mutate: mutateInviteLinkList } = useTeamInvites(team?.id);

  const handleSearchUsers = async () => {
    if (!keywords) {
      toast.warning(t('settings.account.team-member.invite.invite-user.toast.keywords-empty'));
      return;
    }
    if (keywords.length < 4) {
      toast.warning(t('settings.account.team-member.invite.invite-user.toast.keywords-less-than-4'));
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
    if (team && team.id && currentUser.id) {
      setIsHandleCreateInviteLink(true);
      const teamId = team.id;
      const inviterUserId = currentUser?.id;
      toast.promise(
        createTeamInviteLink({
          teamId,
          inviterUserId,
          outdateType,
        }),
        {
          success: (link) => {
            void mutateInviteLinkList();
            if (!link) throw new Error("Link doesn't exists.");
            const newLink = new URL(link);
            newLink.pathname = newLink.pathname
              .split('/')
              .map((it, i) => (i === 1 ? `i-${it}` : it))
              .join('/');
            copy(newLink.href);

            return t('common.operate.success');
          },
          error: t('common.operate.error'),
          loading: t('common.operate.loading'),
          finally: () => {
            setIsHandleCreateInviteLink(false);
          },
        },
      );
    } else {
      toast.warning(t('common.toast.loading'));
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
          <DialogTitle>{t('settings.account.team-member.invite.invite-user.title')}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Input
            placeholder={t('settings.account.team-member.invite.invite-user.search.placeholder')}
            value={keywords}
            onChange={setKeywords}
            onEnterPress={() => {
              void handleSearchUsers();
            }}
          />
          <Button loading={isLoading} onClick={() => handleSearchUsers()}>
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
            {searchResult.map((user) => (
              <UserItem key={user.id} user={user} outdateType={outdateType} teamId={team?.id} />
            ))}
          </div>
        </ScrollArea>
        <div className="flex items-center justify-between">
          <div className="mb-2">
            <h4 className="mb-2 flex items-center gap-2">
              <span>{t('settings.account.team-member.invite.invite-user.outdated.content')}</span>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="cursor-pointer border-b border-solid border-[var(--semi-color-border)]">
                    <span className="flex items-center gap-1">
                      <span className="min-w-16 max-w-32">
                        {outdateType === ITeamInviteLinkOutdateType.SEVEN_DAYS
                          ? t('settings.account.team-member.invite.outdated-options.7-day')
                          : t('settings.account.team-member.invite.outdated-options.never')}
                      </span>
                      <ChevronDown size={15} />
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {[
                    {
                      label: t('settings.account.team-member.invite.outdated-options.7-day'),
                      onSelect: () => setOutdateType(ITeamInviteLinkOutdateType.SEVEN_DAYS),
                    },
                    {
                      label: t('settings.account.team-member.invite.outdated-options.never'),
                      onSelect: () => setOutdateType(ITeamInviteLinkOutdateType.NEVER),
                    },
                  ].map((item, index) => (
                    <DropdownMenuItem key={index} onSelect={item.onSelect}>
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </h4>
            <div className="text-xs opacity-70">
              {t('settings.account.team-member.invite.invite-user.outdated.tip')}
            </div>
          </div>

          <Button size="large" variant="solid" loading={isHandleCreateInviteLink} onClick={handleCopyInviteLink}>
            {t('common.utils.copy')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
