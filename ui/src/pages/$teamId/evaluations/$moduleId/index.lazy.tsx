import { useEffect } from 'react';

import { createLazyFileRoute, useNavigate, useParams } from '@tanstack/react-router';

import { VinesLoading } from '@/components/ui/loading';

export const EvaluationModuleIndex = () => {
  const { moduleId, teamId } = useParams({ from: '/$teamId/evaluations/$moduleId/' });
  const navigate = useNavigate();

  useEffect(() => {
    navigate({
      to: '/$teamId/evaluations/$moduleId/$tab',
      params: { teamId, moduleId, tab: 'leaderboard' },
      replace: true,
    });
  }, [moduleId, teamId, navigate]);

  return <VinesLoading />;
};

export const Route = createLazyFileRoute('/$teamId/evaluations/$moduleId/')({
  component: EvaluationModuleIndex,
});