import React, { useMemo } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { get } from 'lodash';
import { UserRoundPlus } from 'lucide-react';

import { IUserProps, User } from '@/components/layout/main/sidebar/account/users/user.tsx';
import { IUser, swapAccount } from '@/components/router/auth-guard.ts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.tsx';
import { Route } from '@/pages/login.tsx';
import { useLocalStorage } from '@/utils';
import { maskEmail, maskPhone } from '@/utils/maskdata.ts';

export const Users: React.FC = () => {
  const navigate = useNavigate({ from: Route.fullPath });

  const [tokens] = useLocalStorage<Partial<IUser>[]>('vines-tokens', []);
  const [user] = useLocalStorage<Partial<IUser>>('vines-account', {});
  const [, setSwap] = useLocalStorage('vines-authz-swap', 'users');

  const currentUserName = user.name;
  const currentAccount = user.phone ? maskPhone(user.phone.toString()) : user.email ? maskEmail(user.email) : '';
  const currentUserPhoto = user.photo;

  const users: (IUserProps & { id: string })[] = useMemo(
    () =>
      Object.entries(tokens).map(([id, data]) => {
        const usePhone = get(data, 'data.phone', null) !== null;
        const name = get(data, 'data.name', '');
        const _user = get(data, 'data.' + (usePhone ? 'phone' : 'email'), '');
        return {
          id,
          name,
          account: usePhone ? maskPhone(_user) : maskEmail(_user),
          photo: get(data, 'data.photo', ''),
        };
      }),
    [tokens],
  );

  const handleValueChange = (id: string) => {
    if (id === 'login') {
      setSwap('login');
      void navigate({ to: '/login' });
    } else {
      swapAccount(id);
    }
  };

  return (
    <Select value={user.id} onValueChange={handleValueChange}>
      <SelectTrigger className="flex h-auto cursor-pointer items-center gap-2 bg-mauve-2">
        <SelectValue>
          <User name={currentUserName} account={currentAccount} photo={currentUserPhoto} />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {users.map(({ id, ...it }) => (
          <SelectItem className="cursor-pointer" key={id} value={id}>
            <User {...it} isCollapsed />
          </SelectItem>
        ))}
        <SelectSeparator />
        <SelectItem className="cursor-pointer" value="login">
          <div className="flex items-center justify-center gap-2">
            <UserRoundPlus strokeWidth={1.5} size={16} />
            <p>登录其他账号</p>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
