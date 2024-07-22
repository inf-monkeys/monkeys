import React, { useEffect, useRef } from 'react';

import { useMatches, useNavigate } from '@tanstack/react-router';

import { useDeepCompareEffect } from 'ahooks';

import VinesEvent from '@/utils/events.ts';

export const RouteEvent: React.FC = () => {
  const matches = useMatches();
  const routeMatch = matches.find((it) => it.routeId.includes('/$teamId'));
  const routeId = routeMatch?.routeId;
  const routeParams = routeMatch?.params;

  const navigate = useNavigate({ from: routeId });

  const routeMetadata = useRef<Record<string, any>>({});

  useDeepCompareEffect(() => {
    routeMetadata.current = {
      id: routeId,
      params: routeParams,
    };
  }, [routeId, routeParams]);

  useEffect(() => {
    const handleVinesNav = (to: string, params?: Record<string, any>) => {
      if (to === '/login') {
        const metadata = routeMetadata.current;
        return navigate({
          to: '/login/',
          search: {
            redirect_id: metadata.id,
            redirect_params: metadata.params,
          },
        });
      } else {
        return navigate({
          to,
          params: {
            ...routeMetadata.current.params,
            ...params,
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
