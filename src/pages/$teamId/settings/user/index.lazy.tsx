import React from 'react';

import { SettingsUserHeader } from '@/components/layout/main/settings/user-header/index.lazy.tsx';
import { SettingsWrapper } from '@/components/layout/main/settings/wrapper.tsx';

export const UserSettings: React.FC = () => {
  return (
    <SettingsWrapper>
      <SettingsUserHeader />
    </SettingsWrapper>
  );
};
