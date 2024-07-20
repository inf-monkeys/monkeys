import React, { useEffect } from 'react';

import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { useApiKeyList } from '@/apis/api-keys/api-key.ts';
import { ApiKeyItem } from '@/components/layout/settings/api-key/api-key-item';
import { CreateNewApiKey } from '@/components/layout/settings/api-key/create-apikey.tsx';
import { useVinesTeam } from '@/components/router/guard/team.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { VinesFullLoading } from '@/components/ui/loading';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition';

interface IApiKeyProps extends React.ComponentPropsWithoutRef<'div'> {}

export const ApiKey: React.FC<IApiKeyProps> = () => {
  const { t } = useTranslation();

  const { data: apiKeyList, isLoading, mutate } = useApiKeyList();

  const { team } = useVinesTeam();

  useEffect(() => void mutate(), [team?.id]);

  return (
    <Card>
      <CardHeader className="relative">
        <CardTitle>{t('settings.api-key.title')}</CardTitle>
        <CardDescription className="pr-32">{t('settings.api-key.desc')}</CardDescription>
        <div className="absolute left-0 top-0 !mt-0 flex size-full items-center justify-end gap-2 p-6">
          <CreateNewApiKey mutate={mutate} />
        </div>
      </CardHeader>
      <CardContent>
        <SmoothTransition className="relative overflow-hidden">
          <AnimatePresence>{isLoading && <VinesFullLoading motionKey="vines-api-key-list-loading" />}</AnimatePresence>
          <ScrollArea className="h-40">
            <div className="flex flex-col gap-2">
              {(apiKeyList ?? []).map((apiKey, index) => (
                <ApiKeyItem key={index} apiKey={apiKey} mutate={mutate} />
              ))}
            </div>
          </ScrollArea>
        </SmoothTransition>
      </CardContent>
    </Card>
  );
};
