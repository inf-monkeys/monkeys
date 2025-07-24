import React from 'react';

import { Link } from '@tanstack/react-router';

import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { getVinesToken } from '@/apis/utils.ts';
import { VinesLogo } from '@/components/layout/main/vines-logo.tsx';
import { HeaderInvite } from '@/components/layout-wrapper/space/header/expand/header-invite';
import { UserCard } from '@/components/layout-wrapper/space/header/expand/user-card.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import { useElementSize } from '@/hooks/use-resize-observer';
import useUrlState from '@/hooks/use-url-state.ts';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

import { QuotaButton } from './expand/quota-button';

interface ISpaceHeaderProps extends React.ComponentPropsWithoutRef<'header'> {
  tail?: React.ReactNode;
  tailWithAuth?: React.ReactNode;
  disableSeparator?: boolean;
}

export const SpaceHeader: React.FC<ISpaceHeaderProps> = ({
  children,
  tail,
  disableSeparator = false,
  tailWithAuth,
}) => {
  const { t } = useTranslation();

  const { data: oem } = useSystemConfig();

  const { teamId } = useVinesTeam();

  const [mode, setMode] = useUrlState<{ mode: 'normal' | 'fast' | 'mini' }>();

  const [{ hideSpaceHeader: urlHideSpaceHeader }] = useUrlState<{ hideSpaceHeader: boolean }>({
    hideSpaceHeader: false,
  });

  const hideSpaceHeader = urlHideSpaceHeader || oem?.theme.hideSpaceHeader || false;

  const hasToken = !!getVinesToken();

  const showTeamQuota = oem && (oem.module === '*' || oem.module.includes('payment'));
  const showHeaderInvite =
    oem &&
    (!oem.theme.headbar || oem.theme.headbar.actions === '*' || oem.theme.headbar.actions?.includes('team-invite'));

  const theme = oem?.theme.headbar?.theme || 'card';

  const { height, ref } = useElementSize();

  return hideSpaceHeader ? (
    <></>
  ) : (
    <>
      <header
        ref={ref}
        className={cn(
          'flex w-full items-center justify-between bg-slate-1 p-global',
          theme === 'fixed' &&
            'shadow-b-lg fixed left-0 top-0 border-b-[1px] border-t-[3px] border-t-[rgb(var(--vines-500))]',
          theme === 'card' && 'rounded-xl border border-input',
        )}
      >
        <div className="z-20 flex h-8 items-center gap-6">
          <Link
            to="/$teamId"
            params={{ teamId }}
            disabled={!hasToken}
            onClick={() => Object.keys(mode).length && setMode({ mode: 'normal' })}
          >
            <VinesLogo description="" height={'2rem'} className={cn('ml-2', hasToken && 'cursor-pointer')} />
          </Link>
          {children && (
            <>
              {!disableSeparator && <Separator orientation="vertical" className="h-1/2" />}
              {children}
            </>
          )}
        </div>
        <div className="z-20 flex items-center gap-global">
          {showTeamQuota && <QuotaButton />}
          {showHeaderInvite && <HeaderInvite />}
          {tail}
          {hasToken ? (
            <>
              {tailWithAuth}
              <UserCard />
            </>
          ) : (
            <Button
              variant="outline"
              size="small"
              icon={<LogIn />}
              onClick={() => VinesEvent.emit('vines-nav', '/login')}
            >
              {t('auth.login.login')}
            </Button>
          )}
        </div>
      </header>
      {theme === 'fixed' && <div style={{ height }} className="mb-[calc(var(--global-spacing)*1.5)]" />}
    </>
  );
};

//TODO adding real credit info
