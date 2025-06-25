import React from 'react';

import { useParams } from '@tanstack/react-router';

import { AnalyticsView } from './analytics';
import { BattlesView } from './battles';
import { EditView } from './edit';
import { LeaderboardView } from './leaderboard';

export const EvaluationViews: React.FC = () => {
  const { tab } = useParams({ from: '/$teamId/evaluations/$moduleId/$tab/' });

  switch (tab) {
    case 'leaderboard':
      return <LeaderboardView />;
    case 'battles':
      return <BattlesView />;
    case 'analytics':
      return <AnalyticsView />;
    case 'edit':
      return <EditView />;
    default:
      return <LeaderboardView />;
  }
};
