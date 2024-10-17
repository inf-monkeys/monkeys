import React from 'react';

import { createLazyFileRoute } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { Page404 } from '@/components/layout/workspace/404.tsx';

export const TextDataStore: React.FC = () => {
  const { t: tHook } = useTranslation();

  return <Page404 title={tHook('components.layout.main.sidebar.list.store.text-data-store.label')} />;
};

export const Route = createLazyFileRoute('/$teamId/text-data-store/')({
  component: TextDataStore,
});
