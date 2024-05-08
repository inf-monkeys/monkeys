import React, { useMemo } from 'react';

import { motion } from 'framer-motion';
import { get } from 'lodash';
import { UserRoundPlus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IUser, UserList } from '@/components/layout/login/users/users.tsx';
import { IUserTokens } from '@/components/router/guard/auth.ts';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator.tsx';

interface IAuthzUsersProps extends React.ComponentPropsWithoutRef<'div'> {
  tokens: IUserTokens;
  setSwap: (value: string) => void;
}

export const AuthzUsers: React.FC<IAuthzUsersProps> = ({ tokens, setSwap }) => {
  const { t } = useTranslation();

  const users: IUser[] = useMemo(
    () =>
      Object.entries(tokens).map(([id, data]) => {
        const usePhone = get(data, 'data.phone', null) !== null;
        const name = get(data, 'data.name', '');
        return {
          id,
          token: get(data, 'token', ''),
          name,
          shortName: name.substring(0, 2),
          user: get(data, 'data.' + (usePhone ? 'phone' : 'email'), ''),
          photo: get(data, 'data.photo', ''),
        };
      }),
    [tokens],
  );

  return (
    <motion.main
      className="flex w-72 flex-col gap-8"
      key="vines-authz-users"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2 } }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Users size={18} strokeWidth={3} />
          <h1 className="font-bold">{t('auth.users.selector.title')}</h1>
        </div>
        <UserList users={users} />
        <Separator className="my-2" />
        <Button icon={<UserRoundPlus />} onClick={() => setSwap('login')}>
          {t('auth.users.login-other')}
        </Button>
      </div>
    </motion.main>
  );
};
