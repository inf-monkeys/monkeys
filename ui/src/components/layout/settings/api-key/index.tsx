import React, { useMemo } from 'react';

import { AnimatePresence } from 'framer-motion';

import { useApiKeyList } from '@/apis/api-keys/api-key.ts';
import { ApiKeyItem } from '@/components/layout/settings/api-key/api-key-item';
import { ApiKeyHeader } from '@/components/layout/settings/api-key/header.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Loading } from '@/components/ui/loading';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition';

interface IApiKeyProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ApiKey: React.FC<IApiKeyProps> = () => {
  const { data: apiKeyList, isLoading, mutate } = useApiKeyList();

  const { team } = useVinesTeam();

  useMemo(() => {
    void mutate();
  }, [team?.id]);

  return (
    <div className="flex flex-col gap-2">
      <ApiKeyHeader mutate={mutate} />
      <SmoothTransition className="relative overflow-clip">
        <AnimatePresence>{isLoading && <Loading motionKey="vines-api-key-list-loading" />}</AnimatePresence>
        <ScrollArea className="h-[calc(100vh-16.5rem)]">
          <div className="flex flex-col gap-2">
            {(apiKeyList ?? []).map((apiKey, index) => (
              <ApiKeyItem key={index} apiKey={apiKey} mutate={mutate} />
            ))}
          </div>
        </ScrollArea>
      </SmoothTransition>
    </div>
  );
};
