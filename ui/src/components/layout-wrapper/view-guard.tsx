/* eslint-disable react-hooks/rules-of-hooks */
import React, { forwardRef, useState } from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';

import { CircularProgress } from '@nextui-org/progress';
import { useDebounceEffect } from 'ahooks';
import { AnimatePresence, motion } from 'framer-motion';
import { isEmpty } from 'lodash';
import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { workflowPermission } from '@/apis/workflow';
import { VinesDarkMode } from '@/components/layout/main/vines-darkmode.tsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { I18nSelector } from '@/components/ui/i18n-selector';
import { cn, useLocalStorage } from '@/utils';

export const ViewGuard = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { t } = useTranslation();

    const navigate = useNavigate();

    const [token] = useLocalStorage<string>('vines-token', '', false);

    const [loading, setLoading] = useState(false);
    const [isUnAuth, setIsUnAuth] = useState(false);

    const { workflowId } = useParams({ from: '/$teamId/workspace/$workflowId/' });
    const isWorkspace = window['vinesRoute']?.[0] === 'workspace';
    const isTokenEmpty = isEmpty(token);

    useDebounceEffect(
      () => {
        if (workflowId && isWorkspace && isTokenEmpty) {
          setLoading(true);
          workflowPermission(workflowId)
            .then((it) => {
              if (!it) {
                toast.error(t('auth.no-permission'));
              } else {
                setIsUnAuth(!it.notAuthorized);
              }
            })
            .finally(() => setLoading(false));
        }
      },
      [workflowId, isWorkspace, isTokenEmpty],
      {
        wait: 350,
      },
    );

    const visible = loading || isUnAuth || (isTokenEmpty && !isWorkspace);

    return (
      <main ref={ref} className={cn('size-full bg-slate-1', className)} {...props}>
        {children}
        <AnimatePresence>
          {visible && (
            <motion.div
              className="vines-center absolute left-0 top-0 z-[100] flex size-full backdrop-blur"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.25 } }}
            >
              {loading ? (
                <CircularProgress
                  className="mb-4 [&_circle:last-child]:stroke-vines-500"
                  aria-label={t('common.load.loading')}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>{t(isUnAuth ? 'common.toast.Forbidden resource' : 'auth.logging-expired')}</CardTitle>
                  </CardHeader>
                  <CardContent className="vines-center flex">
                    <Button
                      variant="outline"
                      icon={<LogIn />}
                      onClick={() =>
                        navigate({
                          to: '/login',
                          search: {
                            redirect_url:
                              (location.search as { redirect_url?: string })?.redirect_url || location.pathname,
                          },
                        })
                      }
                    >
                      {t('auth.login.login')}
                    </Button>
                  </CardContent>
                </Card>
              )}
              <div className="absolute bottom-6 left-6 flex items-center gap-2">
                <VinesDarkMode />
                <I18nSelector />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    );
  },
);
ViewGuard.displayName = 'ViewGuard';
