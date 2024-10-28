/* eslint-disable react-hooks/rules-of-hooks */
import React, { forwardRef, useState } from 'react';

import { useParams } from '@tanstack/react-router';

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
import { VinesLoading } from '@/components/ui/loading';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/utils';
import VinesEvent from '@/utils/events.ts';

export const ViewGuard = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { t } = useTranslation();

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
      <main ref={ref} className={cn('size-full bg-slate-1 p-4', className)} {...props}>
        {children}
        <AnimatePresence>
          {visible && (
            <motion.div
              className="vines-center absolute left-0 top-0 z-[100] flex size-full backdrop-blur"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.42 } }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? (
                <VinesLoading />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>{t(isUnAuth ? 'common.toast.Forbidden resource' : 'auth.login-expired')}</CardTitle>
                  </CardHeader>
                  <CardContent className="vines-center flex">
                    <Button variant="outline" icon={<LogIn />} onClick={() => VinesEvent.emit('vines-nav', '/login')}>
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
