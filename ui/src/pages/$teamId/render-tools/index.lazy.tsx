import React from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

export const RenderTools: React.FC = () => {
  return <>RenderTools</>;
};

export const Route = createLazyFileRoute('/$teamId/render-tools/')({
  component: RenderTools,
});
