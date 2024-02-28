import React from 'react';

import { SettingsWrapper } from '@/components/layout/main/settings/wrapper.tsx';
import { SettingsUserHeader } from '@/pages/$teamId/settings/user-header.lazy.tsx';

export const UserSettings: React.FC = () => {
  return (
    <SettingsWrapper>
      <SettingsUserHeader />
    </SettingsWrapper>
  );
};
