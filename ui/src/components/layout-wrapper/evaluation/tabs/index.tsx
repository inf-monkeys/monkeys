import React from 'react';

import { useNavigate, useParams } from '@tanstack/react-router';

import { BarChart3, Settings, Swords, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/utils';

const EVALUATION_TABS = [
  {
    id: 'leaderboard',
    name: 'ugc-page.evaluation.leaderboard.title',
    icon: Trophy,
    description: 'ugc-page.evaluation.leaderboard.description',
  },
  {
    id: 'battles',
    name: 'ugc-page.evaluation.battles.title',
    icon: Swords,
    description: 'ugc-page.evaluation.battles.description',
  },
  {
    id: 'analytics',
    name: 'ugc-page.evaluation.analytics.title',
    icon: BarChart3,
    description: 'ugc-page.evaluation.analytics.description',
  },
  {
    id: 'edit',
    name: 'ugc-page.evaluation.edit.title',
    icon: Settings,
    description: 'ugc-page.evaluation.edit.description',
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
    <div className="space-y-1">
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
              isActive && 'bg-primary/10 text-primary hover:bg-primary/15',
            )}
          >
            <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
            <div className="flex-1 text-left">
              <div className={cn('font-medium', isActive ? 'text-primary' : 'text-foreground')}>{t(tab.name)}</div>
              <div className="line-clamp-1 text-xs text-muted-foreground">{t(tab.description)}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
