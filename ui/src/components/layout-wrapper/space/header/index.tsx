import React from 'react';

import { Link, useParams } from '@tanstack/react-router';

import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getVinesToken } from '@/apis/utils.ts';
import { VinesLogo } from '@/components/layout/main/vines-logo.tsx';
import { UserCard } from '@/components/layout-wrapper/space/header/expand/user-card.tsx';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';
import VinesEvent from '@/utils/events.ts';

interface ISpaceHeaderProps extends React.ComponentPropsWithoutRef<'header'> {
  tail?: React.ReactNode;
  tailWithAuth?: React.ReactNode;
}

export const SpaceHeader: React.FC<ISpaceHeaderProps> = ({ children, tail, tailWithAuth }) => {
  const { t } = useTranslation();

  const { teamId } = useParams({ from: '/$teamId/workspace/$workflowId/$pageId/' });

  const hasToken = !!getVinesToken();

  return (
    <header className="flex h-14 w-full items-center justify-between bg-slate-1 px-6 shadow-sm">
      <div className="z-20 flex h-full items-center gap-5">
        <Link to="/$teamId/" params={{ teamId }} disabled={!hasToken}>
          <VinesLogo description="" height={32} className={hasToken ? 'cursor-pointer' : ''} />
        </Link>
        <Separator orientation="vertical" className="h-1/2" />
        {children}
      </div>
      <div className="z-20 flex items-center gap-4">
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
