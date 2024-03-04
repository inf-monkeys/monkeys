import { toast } from 'sonner';

export interface IVinesHeaderOptions {
  apiKey?: string;
  useToast?: boolean;
}

export const vinesHeader = ({ apiKey, useToast = false }: IVinesHeaderOptions) => {
  const teamId = localStorage.getItem('vines-team-id');
  if (apiKey) {
    return { 'X-Vines-Apikey': apiKey, ...(teamId && { Team: teamId }) };
  }

  const token = localStorage.getItem('vines-token');

  if (!token) {
    if (useToast) {
      toast.warning('需要登录');
    } else {
      throw new Error('需要登录');
    }
  }

  return { Authentication: `Bearer ${token}`, ...(teamId && { Team: teamId }) };
};
