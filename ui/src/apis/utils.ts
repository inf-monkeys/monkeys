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
    if (useToast) {
      toast.warning('需要登录');
    } else {
      throw new Error('需要登录');
    }
  }

  return { Authorization: `Bearer ${token}`, ...(teamId && { 'x-monkeys-teamid': teamId }) };
};
