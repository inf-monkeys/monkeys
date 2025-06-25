import React from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';
import { BarChart3, Settings, Swords, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils';

const EVALUATION_TABS = [
  {
    id: 'leaderboard',
    name: 'evaluation.tabs.leaderboard',
    icon: Trophy,
    description: 'evaluation.tabs.leaderboard.description',
  },
  {
    id: 'battles',
    name: 'evaluation.tabs.battles',
    icon: Swords,
    description: 'evaluation.tabs.battles.description',
  },
  {
    id: 'analytics',
    name: 'evaluation.tabs.analytics',
    icon: BarChart3,
    description: 'evaluation.tabs.analytics.description',
  },
  {
    id: 'edit',
    name: 'evaluation.tabs.edit',
    icon: Settings,
    description: 'evaluation.tabs.edit.description',
  },
] as const;

interface EvaluationTabsProps {
  currentTab: string;
}

export const EvaluationTabs: React.FC<EvaluationTabsProps> = ({ currentTab }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { teamId, moduleId } = useParams({ from: '/$teamId/evaluations/$moduleId/$tab/' });

  const handleTabClick = (tabId: string) => {
    navigate({
      to: '/$teamId/evaluations/$moduleId/$tab',
      params: { teamId, moduleId, tab: tabId },
    });
  };

  return (
    <div className="space-y-1 p-3">
      {EVALUATION_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              'hover:bg-muted/50',
              isActive && 'bg-primary/10 text-primary hover:bg-primary/15'
            )}
          >
            <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
            <div className="flex-1 text-left">
              <div className={cn('font-medium', isActive ? 'text-primary' : 'text-foreground')}>
                {t(tab.name)}
              </div>
              <div className="text-xs text-muted-foreground line-clamp-1">
                {t(tab.description)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};