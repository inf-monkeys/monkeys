import React from 'react';

import { useNavigate } from '@tanstack/react-router';

import { useMemoizedFn } from 'ahooks';
import { Languages, LogOut, Moon, Sun, SunMoon, UserCog } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { useVinesUser } from '@/components/router/guard/user.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { LANGUAGES_LIST } from '@/components/ui/i18n-selector/consts.ts';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { getI18nContent, isJSONString } from '@/utils';
import VinesEvent from '@/utils/events.ts';

interface IUserCardProps extends React.ComponentPropsWithoutRef<'div'> {}

export const UserCard: React.FC<IUserCardProps> = () => {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;

  const handleToggleLanguage = useMemoizedFn((lang: string) => {
    toast.promise(i18n.changeLanguage(lang), {
      loading: t('common.language-selector.switching'),
      success: t('common.language-selector.switched'),
      error: t('common.language-selector.switch-failed'),
    });
  });

  const navigate = useNavigate();
  const { userPhoto, userName } = useVinesUser();

  const [mode, setLocalDarkMode] = useLocalStorage<string>('vines-ui-dark-mode', 'auto', false);

  const isAutoMode = mode === 'auto';
  const isDarkMode = mode === 'dark';
  const isLightMode = mode === 'light';

  const { teamId, team } = useVinesTeam();

  const teamName = team?.name ?? t('components.layout.main.sidebar.teams.默认团队');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-8 cursor-pointer">
          <AvatarImage className="aspect-auto" src={userPhoto} alt={userName} />
          <AvatarFallback className="rounded-none p-2 text-xs">{userName.substring(0, 2)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-52" align="end">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Avatar className="size-8 cursor-pointer">
            <AvatarImage className="aspect-auto" src={userPhoto} alt={userName} />
            <AvatarFallback className="rounded-none p-2 text-xs">{userName.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-blod text-sm">{userName}</h1>
            <p className="text-xs font-normal">
              {t(
                [`components.layout.main.sidebar.teams.${isJSONString(teamName) ? '' : teamName}`],
                getI18nContent(teamName),
              )}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup className="px-2">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="flex gap-2"
              suffix={
                <span className="ml-auto text-xs">
                  {isAutoMode
                    ? t('common.dark-mode-selector.auto')
                    : isDarkMode
                      ? t('common.dark-mode-selector.dark')
                      : t('common.dark-mode-selector.light')}
                </span>
              }
            >
              <SunMoon strokeWidth={1.5} size={16} />
              <span>{t('common.dark-mode-selector.label')}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent sideOffset={16}>
              <DropdownMenuGroup>
                <DropdownMenuCheckboxItem
                  checked={isAutoMode}
                  disabled={isAutoMode}
                  onCheckedChange={() => setLocalDarkMode('auto')}
                  className="flex gap-2"
                >
                  <SunMoon size={16} strokeWidth={1.5} />
                  <span>{t('common.dark-mode-selector.auto')}</span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={isLightMode}
                  disabled={isLightMode}
                  onCheckedChange={() => setLocalDarkMode('light')}
                  className="flex gap-2"
                >
                  <Sun size={16} strokeWidth={1.5} />
                  <span>{t('common.dark-mode-selector.light')}</span>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={isDarkMode}
                  disabled={isDarkMode}
                  onCheckedChange={() => setLocalDarkMode('dark')}
                  className="flex gap-2"
                >
                  <Moon size={16} strokeWidth={1.5} />
                  <span>{t('common.dark-mode-selector.dark')}</span>
                </DropdownMenuCheckboxItem>
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="flex gap-2"
              suffix={
                <span className="ml-auto text-xs">
                  {LANGUAGES_LIST.find(([lang]) => lang === currentLanguage)?.[1] ?? currentLanguage}
                </span>
              }
            >
              <Languages strokeWidth={1.5} size={16} />
              <span>{t('common.language-selector.tooltip')}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent sideOffset={16}>
              <DropdownMenuGroup>
                {LANGUAGES_LIST.map(([lang, displayName]) => (
                  <DropdownMenuCheckboxItem
                    key={lang}
                    checked={currentLanguage === lang}
                    onCheckedChange={() => handleToggleLanguage(lang)}
                  >
                    {displayName}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem
            className="flex gap-2"
            onClick={() =>
              navigate({
                to: '/$teamId/settings',
                params: { teamId },
                search: {
                  tab: 'account',
                },
              } as any)
            }
          >
            <UserCog strokeWidth={1.5} size={16} />
            <span>{t('components.layout.main.sidebar.toolbar.settings-tooltip')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex gap-2 text-red-10" onClick={() => VinesEvent.emit('vines-logout')}>
            <LogOut strokeWidth={1.5} size={16} />
            <span>{t('workspace.wrapper.user.logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
