import React, { forwardRef } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { isEmpty } from 'lodash';
import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { cn, useLocalStorage } from '@/utils';

export const ViewGuard = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { t } = useTranslation();

    const navigate = useNavigate();

    const [token] = useLocalStorage<string>('vines-token', '', false);

    return (
      <main ref={ref} className={cn('size-full bg-slate-1', className)} {...props}>
        {children}
        {isEmpty(token) && (
          <div className="vines-center absolute left-0 top-0 z-[100] flex size-full backdrop-blur">
            <Card>
              <CardHeader>
                <CardTitle>{t('auth.logging-expired')}</CardTitle>
              </CardHeader>
              <CardContent className="vines-center flex">
                <Button
                  variant="outline"
                  icon={<LogIn />}
                  onClick={() =>
                    navigate({
                      to: '/login',
                      search: {
                        redirect_url: (location.search as { redirect_url?: string })?.redirect_url || location.pathname,
                      },
                    })
                  }
                >
                  {t('auth.login.login')}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    );
  },
);
ViewGuard.displayName = 'ViewGuard';
