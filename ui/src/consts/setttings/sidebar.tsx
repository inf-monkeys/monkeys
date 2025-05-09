import { BotIcon } from 'lucide-react';
export interface SettingsTabNavItem {
  name: string;
  to?: string;
  icon?: React.ReactNode;
}

export const SETTINGS_SIDEBAR_MAP: SettingsTabNavItem[] = [
  {
    name: 'settings.individual-configurations.title',
    icon: <BotIcon />,
    to: '/$teamId/settings?tab=account',
  },
  {
    name: 'settings.team-configurations.title',
    icon: <BotIcon />,
    to: '/$teamId/settings?tab=team-configurations',
  },
  {
    name: 'settings.team-quota.title',
    icon: <BotIcon />,
    to: '/$teamId/settings?tab=team-quota',
  },
  {
    name: 'settings.stat.title',
    icon: <BotIcon />,
    to: '/$teamId/settings?tab=stat',
  },
  {
    name: 'settings.api-key.title',
    icon: <BotIcon />,
    to: '/$teamId/settings?tab=apikey',
  },
];
