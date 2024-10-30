import React, { useEffect } from 'react';

import { useSWRConfig } from 'swr';
import { useNavigate, useSearch } from '@tanstack/react-router';

import { has } from 'lodash';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isMongoId } from 'validator';

import { useLoginByPassword } from '@/apis/authz';
import { getVinesToken } from '@/apis/utils.ts';
import { saveAuthToken } from '@/components/router/guard/auth.ts';
import { setLocalStorage } from '@/hooks/use-local-storage';
import VinesEvent from '@/utils/events.ts';

export const AuthWithRouteSearch: React.FC = () => {
  const { t } = useTranslation();
  const { mutate } = useSWRConfig();
  const navigate = useNavigate();

  const search = useSearch({
    strict: false,
  }) as Record<string, string>;

  const { redirect_id, redirect_params, redirect_search } = search;

  const isRenewalAuthMode = search?.auth_mode === 'renewal';
  const { trigger, data } = useLoginByPassword(!isRenewalAuthMode);

  const handelRedirect = () => {
    let needRedirect = false;
    if (redirect_id && redirect_params) {
      needRedirect = true;
    }

    mutate('/api/teams').then((it) => {
      const splitPath = location.pathname?.split('/') ?? [];
      const teamIdWithPath = splitPath?.find((it) => isMongoId(it));
      const teamId = teamIdWithPath ?? it?.[0]?.id;
      if (teamId) {
        localStorage.setItem('vines-team-id', teamId);
        window['vinesTeamId'] = teamId;
        void mutate((k: any) => k);
      }

      setLocalStorage('vines-teams', it);
      if (needRedirect) {
        delete redirect_search['auth_mode'];
        delete redirect_search['auth_user'];
        delete redirect_search['auth_pwd'];
        delete redirect_search['auth_token'];
        VinesEvent.emit('vines-nav', redirect_id, redirect_params, redirect_search);
      } else {
        if (teamId) {
          VinesEvent.emit('vines-nav', '/$teamId/', { teamId });
        } else {
          void navigate({ to: '/' });
        }
      }
    });
  };

  useEffect(() => {
    const splitPath = location.pathname?.split('/') ?? [];
    const teamIdWithPath = splitPath?.find((it) => isMongoId(it));
    if (teamIdWithPath) {
      localStorage.setItem('vines-team-id', teamIdWithPath);
      window['vinesTeamId'] = teamIdWithPath;
    }

    if (getVinesToken() && !['force', 'renewal'].includes(search?.auth_mode ?? '')) return;

    if (has(search, 'auth_user') && has(search, 'auth_pwd')) {
      void trigger({
        email: search?.auth_user ?? '',
        password: search?.auth_pwd ?? '',
        ...(isRenewalAuthMode && teamIdWithPath && { initialTeamId: teamIdWithPath }),
      });
      return;
    } else if (has(search, 'auth_token')) {
      saveAuthToken(search?.auth_token).then((user) => {
        if (!user) {
          toast.warning(t('auth.oidc.auth-failed'));
          localStorage.removeItem('vines-token');
          localStorage.removeItem('vines-team-id');
          window['vinesTeamId'] = void 0;
          VinesEvent.emit('vines-nav', '/login');
          return;
        }

        handelRedirect();
        // toast.success(t('auth.login.success'));
      });
    }
  }, [search]);

  useEffect(() => {
    if (!data) return;

    // 必须放在外面，否则之前没有登录态的不会跳转
    const hasToken = !!getVinesToken();
    saveAuthToken(data?.token ?? '').then((result) => {
      if (hasToken && isRenewalAuthMode) return;

      if (result) {
        handelRedirect();
      }
      // toast.success(t('auth.login.success'));
    });
  }, [data]);

  return null;
};
