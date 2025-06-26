import { BotIcon } from 'lucide-react';
export interface SettingsTabNavItem {
  id: string;
  name: string;
  to?: string;
  icon?: React.ReactNode;
}

export const SETTINGS_SIDEBAR_MAP: SettingsTabNavItem[] = [
  {
    id: 'account',
    name: 'settings.individual-configurations.title',
    icon: <BotIcon />,
    to: '/$teamId/settings?tab=account',
  },
  {
    id: 'config',
    name: 'settings.team-configurations.title',
    icon: <BotIcon />,
    to: '/$teamId/settings?tab=team-configurations',
  },
  {
    id: 'quota',
    name: 'settings.team-quota.title',
    icon: <BotIcon />,
    to: '/$teamId/settings?tab=team-quota',
  },
  {
    id: 'stat',
    name: 'settings.stat.title',
    icon: <BotIcon />,
    to: '/$teamId/settings?tab=stat',
  },
  {
    id: 'apikey',
    name: 'settings.api-key.title',
    icon: <BotIcon />,
    to: '/$teamId/settings?tab=apikey',
  },
];
