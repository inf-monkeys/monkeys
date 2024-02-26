import React, { useMemo } from 'react';

import { useNavigate } from '@tanstack/react-router';

import { get } from 'lodash';
import { LogOut, UserRoundPlus } from 'lucide-react';

import { useTeams } from '@/apis/authz/team';
import { IUserProps, User } from '@/components/layout/main/sidebar/account/user.tsx';
import { IUser, logout, swapAccount } from '@/components/router/guard/auth.ts';
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

export const Account: React.FC = () => {
  const navigate = useNavigate({ from: Route.fullPath });

  const [tokens] = useLocalStorage<Partial<IUser>[]>('vines-tokens', []);
  const [user] = useLocalStorage<Partial<IUser>>('vines-account', {});
  const [, setSwap] = useLocalStorage('vines-authz-swap', 'users', false);

  const { mutate: teamsMutate } = useTeams();

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

  const handleValueChange = async (id: string) => {
    if (id === 'login') {
      setSwap('login');
      void navigate({ to: '/login' });
    } else if (id === 'logout') {
      const userId = user.id ?? '';
      if (await logout(userId)) {
        const filtered = users.filter((it) => it.id !== userId);
        if (!filtered.length) {
          await navigate({ to: '/login' });
        } else {
          swapAccount(filtered[0].id);
          setTimeout(() => teamsMutate());
        }
      }
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
        <SelectItem className="cursor-pointer" value="logout">
          <div className="flex items-center justify-center gap-2 text-red-10">
            <LogOut strokeWidth={1.5} size={16} />
            <p>退出登录</p>
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};
