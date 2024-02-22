import React from 'react';

import { motion } from 'framer-motion';

interface IAuthzUsersProps extends React.ComponentPropsWithoutRef<'div'> {
  tokens: Record<string, string>;
}

export const AuthzUsers: React.FC<IAuthzUsersProps> = ({ tokens }) => {
  return (
    <motion.main
      className="flex flex-col gap-8"
      key="vines-authz-users"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2 } }}
      exit={{ opacity: 0 }}
    >
      <h1 className="font-bold">选择身份</h1>
    </motion.main>
  );
};
