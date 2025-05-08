import { BotIcon } from 'lucide-react';
export interface SettingsTabNavItem {
  name: string;
  to?: string;
  icon?: React.ReactNode;
}

export const SETTINGS_SIDEBAR_MAP: SettingsTabNavItem[] = [
  {
    name: 'settings.account.title',
    icon: <BotIcon />,
    to: '/$teamId/settings?tab=account',
  },
  {
    name: 'settings.account.team.title',
    icon: <BotIcon />,
    to: '/$teamId/settings?tab=team',
  },
  {
    name: 'settings.payment.property.title',
    icon: <BotIcon />,
    to: '/$teamId/settings?tab=team-credit',
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
