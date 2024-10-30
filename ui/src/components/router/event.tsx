import React, { useLayoutEffect, useRef } from 'react';

import { useMatches, useNavigate } from '@tanstack/react-router';

import { useDeepCompareEffect } from 'ahooks';

import VinesEvent from '@/utils/events.ts';

export const RouteEvent: React.FC = () => {
  const matches = useMatches();
  const routeMatch = matches.find((it) => it.routeId.includes('/$teamId'));
  const routeId = routeMatch?.routeId;
  const routeParams = routeMatch?.params;
  const routeSearch = routeMatch?.search;

  const navigate = useNavigate({ from: routeId });

  const routeMetadata = useRef<Record<string, any>>({});

  useDeepCompareEffect(() => {
    routeMetadata.current = {
      id: routeId,
      params: routeParams,
      search: routeSearch,
    };
  }, [routeId, routeParams]);

  useLayoutEffect(() => {
    const handleVinesNav = (to: string, params?: Record<string, any>, search?: Record<string, any>) => {
      if (to === '/login') {
        const metadata = routeMetadata.current;
        return navigate({
          to: '/login/',
          search: {
            redirect_id: metadata.id,
            redirect_params: metadata.params,
            redirect_search: metadata.search,
          },
        });
      } else {
        return navigate({
          to: to.endsWith('/') && !to.endsWith('$teamId/') ? to.slice(0, -1) : (to as any),
          params: {
            ...routeMetadata.current.params,
            ...params,
          },
          search: {
            ...routeMetadata.current.search,
            ...search,
          },
        });
      }
    };

    VinesEvent.on('vines-nav', handleVinesNav);
    return () => {
      VinesEvent.off('vines-nav', handleVinesNav);
    };
  }, []);

  return null;
};
