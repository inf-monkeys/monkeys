import { createFileRoute } from '@tanstack/react-router';

import { useTranslation } from 'react-i18next';

import { teamIdGuard } from '@/components/router/guard/team-id.ts';

export const Agents: React.FC = () => {
  const { t } = useTranslation();
  return (
    <main className="flex size-full">
      <span className="flex h-full w-full items-center justify-center text-xl">{t('common.utils.coming-soon')}</span>
    </main>
  );
};

export const Route = createFileRoute('/$teamId/agents/')({
  component: Agents,
  beforeLoad: teamIdGuard,
});
