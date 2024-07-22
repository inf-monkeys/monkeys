import { t } from 'i18next';
import { toast } from 'sonner';

export interface IVinesHeaderOptions {
  apikey?: string;
  useToast?: boolean;
}

export const getVinesToken = () => localStorage.getItem('vines-token');

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
        toast.warning(t('auth.login-expired'));
      }
      throw new Error('Login Required');
    } else {
      return { 'x-monkeys-workflow-id': workflowId, 'x-monkeys-teamid': teamId || routeTeamId };
    }
  }

  return { Authorization: `Bearer ${token}`, ...(teamId && { 'x-monkeys-teamid': teamId }) };
};
