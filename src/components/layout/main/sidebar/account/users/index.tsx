import React, { useMemo } from 'react';

import { get } from 'lodash';
import { toast } from 'sonner';

import { User } from '@/components/layout/main/sidebar/account/users/user.tsx';
import { IUser, saveAuthToken } from '@/components/router/auth-guard.ts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.tsx';
import { useLocalStorage } from '@/utils';
import { maskEmail, maskPhone } from '@/utils/maskdata.ts';

interface IUsersProps {}

export const Users: React.FC<IUsersProps> = () => {
  const [tokens] = useLocalStorage<Partial<IUser>[]>('vines-tokens', []);
  const [user] = useLocalStorage<Partial<IUser>>('vines-user', {});

  const currentUserName = user.name;
  const currentAccount = user.phone ? maskPhone(user.phone.toString()) : user.email ? maskEmail(user.email) : '';
  const currentUserPhoto = user.photo;

  const users = useMemo(
    () =>
      Object.entries(tokens).map(([id, data]) => {
        const usePhone = get(data, 'data.phone', null) !== null;
        const name = get(data, 'data.name', '');
        const _user = get(data, 'data.' + (usePhone ? 'phone' : 'email'), '');
        return {
          id,
          token: get(data, 'token', ''),
          name,
          account: usePhone ? maskPhone(_user) : maskEmail(_user),
          photo: get(data, 'data.photo', ''),
        };
      }),
    [tokens],
  );

  const handleSwapUser = (token: string) => {
    if (!token) {
      return toast.error('切换失败！');
    }
    saveAuthToken(token);
    toast.success('身份已切换');
  };

  return (
    <Select value={user.id} onValueChange={(id) => handleSwapUser(users?.find((it) => it.id === id)?.token ?? '')}>
      <SelectTrigger className="flex h-auto cursor-pointer items-center gap-2 bg-mauve-2">
        <SelectValue>
          <User name={currentUserName} account={currentAccount} photo={currentUserPhoto} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {users.map(({ id, token, ...it }) => (
          <SelectItem className="cursor-pointer" key={id} value={id}>
            <User {...it} isCollapsed />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
