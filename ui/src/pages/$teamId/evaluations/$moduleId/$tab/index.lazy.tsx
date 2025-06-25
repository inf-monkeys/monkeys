import { createLazyFileRoute, useParams } from '@tanstack/react-router';

import { EvaluationLayout } from '@/components/layout-wrapper/evaluation';

export const EvaluationModuleTab = () => {
  const { tab } = useParams({ from: '/$teamId/evaluations/$moduleId/$tab/' });

  return <EvaluationLayout currentTab={tab} />;
};

export const Route = createLazyFileRoute('/$teamId/evaluations/$moduleId/$tab/')({
  component: EvaluationModuleTab,
});