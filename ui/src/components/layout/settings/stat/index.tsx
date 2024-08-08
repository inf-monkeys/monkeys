import React from 'react';

import { useTranslation } from 'react-i18next';

import { AgentStat } from '@/components/layout/settings/stat/agent.tsx';
import { WorkflowStat } from '@/components/layout/settings/stat/workflow.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.tsx';

interface IStatProps {}

export const Stat: React.FC<IStatProps> = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 pb-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.stat.workflow.label')}</CardTitle>
          <CardDescription>{t('settings.stat.workflow.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkflowStat />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.stat.agent.label')}</CardTitle>
          <CardDescription>{t('settings.stat.agent.desc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <AgentStat />
        </CardContent>
      </Card>
    </div>
  );
};
