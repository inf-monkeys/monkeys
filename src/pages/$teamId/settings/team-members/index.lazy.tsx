import React from 'react';

import { SettingsWrapper } from '@/components/layout/main/settings/wrapper.tsx';
import { SettingsTeamHeader } from '@/pages/$teamId/settings/team-header/index.lazy.tsx';

export const TeamMembersSettings: React.FC = () => {
  return (
    <SettingsWrapper>
      <SettingsTeamHeader />
    </SettingsWrapper>
  );
};
