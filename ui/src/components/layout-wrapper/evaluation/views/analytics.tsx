import React from 'react';

import { BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const AnalyticsView: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={`h-full overflow-auto rounded-lg border border-input p-6`}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <BarChart3 className="h-6 w-6" />
              {t('ugc-page.evaluation.analytics.title')}
            </h1>
            <p className="text-muted-foreground">{t('ugc-page.evaluation.analytics.description')}</p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('ugc-page.evaluation.analytics.coming-soon.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center">
              <p className="text-muted-foreground">{t('ugc-page.evaluation.analytics.coming-soon.description')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
