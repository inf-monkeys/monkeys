import React from 'react';

import { Link } from '@tanstack/react-router';

import { get } from 'lodash';
import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { CustomizationHeadbarNavPosition, CustomizationHeadbarTheme } from '@/apis/common/typings';
import { getVinesToken } from '@/apis/utils.ts';
import { HeaderInvite } from '@/components/layout-wrapper/space/header/expand/header-invite';
import { UserCard } from '@/components/layout-wrapper/space/header/expand/user-card.tsx';
import { VinesLogo } from '@/components/layout/main/vines-logo.tsx';
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

  const [{ mode, hideSpaceHeader: urlHideSpaceHeader }, setSearch] = useUrlState<{
    mode: 'normal' | 'fast' | 'mini';
    hideSpaceHeader: boolean;
  }>();

  const hideSpaceHeader = urlHideSpaceHeader || oem?.theme.hideSpaceHeader || false;

  const hasToken = !!getVinesToken();

  const showTeamQuota = oem && (oem.module === '*' || oem.module.includes('payment'));
  const showHeaderInvite =
    oem &&
    (!oem.theme.headbar || oem.theme.headbar.actions === '*' || oem.theme.headbar.actions?.includes('team-invite'));

  const theme = get(oem, 'theme.headbar.theme', 'card') as CustomizationHeadbarTheme;
  const navPosition = get(oem, 'theme.headbar.navPosition', 'left') as CustomizationHeadbarNavPosition;

  const { height, ref } = useElementSize();

  return hideSpaceHeader ? (
    <></>
  ) : (
    <>
      <header
        ref={ref}
        className={cn(
          `flex h-[72px] w-full items-center justify-between gap-4 rounded-lg bg-slate-1 p-global`,
          theme === 'fixed' &&
            'shadow-b-lg fixed left-0 top-0 border-b-[1px] border-t-[3px] border-t-[rgb(var(--vines-500))]',
          !['fixed', 'glassy', 'bsd-blue'].includes(theme) && `border border-input`,
          theme === 'bsd-blue' && 'relative',
        )}
        style={
          theme === 'glassy'
            ? {
                background: '#ebefef',
                backgroundBlendMode: 'overlay',
                boxSizing: 'border-box',
                border: '1.5px solid rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(45px)',
                boxShadow: 'inset 0px 0px 0px 0px rgba(0, 0, 0, 0.1)',
              }
            : theme === 'bsd-blue'
              ? {
                  background: 'rgba(43, 93, 241,0.3)',
                  boxSizing: 'border-box',
                  backdropFilter: 'blur(32px)',
                  borderRadius: '20px',
                }
              : {}
        }
      >
        {theme === 'bsd-blue' && (
          <div
            className="pointer-events-none absolute inset-0 rounded-[20px]"
            style={{
              padding: '1px',
              background:
                'conic-gradient(from 158deg at 74% 49%, #12DCFF -5deg, #3159D1 51deg, #8099E3 159deg, #3159D1 259deg, #258AE2 295deg, #12DCFF 355deg, #3159D1 411deg)',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'xor',
            }}
          />
        )}
        <Link
          to="/$teamId"
          params={{ teamId }}
          disabled={!hasToken}
          onClick={() => Object.keys(mode).length && setSearch({ mode: 'normal' })}
        >
          <VinesLogo description="" height={'2rem'} className={cn('ml-2', hasToken && 'cursor-pointer')} />
        </Link>
        {navPosition === 'right' && <div className="flex-1" />}
        <div className="relative z-20 flex h-8 items-center gap-6">
          {children && navPosition === 'center' ? (
            <div className="absolute left-1/2 top-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              {children}
            </div>
          ) : (
            <>
              {!disableSeparator && <Separator orientation="vertical" className="h-1/2" />}
              <div>{children}</div>
            </>
          )}
        </div>
        {navPosition === 'left' && <div className="flex-1" />}
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
