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

  const hideSpaceHeader = urlHideSpaceHeader ?? oem?.theme.hideSpaceHeader ?? false;

  const hasToken = !!getVinesToken();

  const showTeamQuota = oem && (oem.module === '*' || oem.module.includes('payment'));

  return hideSpaceHeader ? (
    <></>
  ) : (
    <header className="flex w-full items-center justify-between rounded-xl border border-input bg-slate-1 p-3">
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
      <div className="z-20 flex items-center gap-4">
        {showTeamQuota && <QuotaButton />}
        <HeaderInvite />
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
  );
};

//TODO adding real credit info
