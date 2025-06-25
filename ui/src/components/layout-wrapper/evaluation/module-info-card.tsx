import React from 'react';

import { useParams } from '@tanstack/react-router';
import { Calendar, Target, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getModuleDetails } from '@/apis/evaluation';
import { Badge } from '@/components/ui/badge';
import useSWR from 'swr';
import { formatTimeDiffPrevious } from '@/utils/time.ts';

export const EvaluationModuleInfoCard: React.FC = () => {
  const { t } = useTranslation();
  const { moduleId } = useParams({ from: '/$teamId/evaluations/$moduleId/$tab/' });
  
  const { data: module } = useSWR(moduleId ? ['evaluation-module', moduleId] : null, () =>
    getModuleDetails(moduleId),
  );

  if (!module) {
    return (
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white">
          E
        </div>
        <div className="flex-1">
          <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
          <div className="mt-1 h-3 w-24 animate-pulse rounded bg-muted"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white">
        E
        {module.isActive && (
          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-sm font-medium">{module.displayName}</h2>
          <Badge variant={module.isActive ? 'default' : 'secondary'} className="text-xs">
            {module.isActive ? t('common.status.active') : t('common.status.inactive')}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatTimeDiffPrevious(module.createdTimestamp || 0)}</span>
          </div>
          
          {module.participantAssetIds && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{module.participantAssetIds.length} {t('evaluation.participants')}</span>
            </div>
          )}
          
          {module.evaluationCriteria && (
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              <span className="truncate max-w-32">{module.evaluationCriteria}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};