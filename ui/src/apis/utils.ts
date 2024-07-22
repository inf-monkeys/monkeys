import { t } from 'i18next';
import { toast } from 'sonner';

export interface IVinesHeaderOptions {
  apikey?: string;
  useToast?: boolean;
}

export const getVinesToken = () => localStorage.getItem('vines-token');

let warningToastCount = 0;
let warningToastTimer: NodeJS.Timeout | null = null;

export const vinesHeader = ({ apikey, useToast = false }: IVinesHeaderOptions) => {
  const teamId = localStorage.getItem('vines-team-id');
  if (apikey) {
    return { 'X-Vines-Apikey': apikey, ...(teamId && { 'x-monkeys-teamid': teamId }) };
  }

  const token = getVinesToken();

  if (!token) {
    const [vinesRoute, routeTeamId, workflowId] = window['vinesRoute'];
    if (vinesRoute !== 'workspace') {
      if (useToast) {
        warningToastCount++;

        if (warningToastTimer) {
          clearTimeout(warningToastTimer);
        }

        warningToastTimer = setTimeout(() => {
          toast.warning(t('auth.login-required', { count: warningToastCount }));
          warningToastCount = 0;
        }, 2000);
      }
      throw new Error('Login Required');
    } else {
      return { 'x-monkeys-workflow-id': workflowId, 'x-monkeys-teamid': teamId || routeTeamId };
    }
  }

  return { Authorization: `Bearer ${token}`, ...(teamId && { 'x-monkeys-teamid': teamId }) };
};
