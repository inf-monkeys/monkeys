import React, { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { EmailAuth } from '@/components/layout/login/authz/email-auth.tsx';
import { PhoneAuth } from '@/components/layout/login/authz/phone-auth.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';

interface IAuthContainerProps extends React.ComponentPropsWithoutRef<'div'> {
  enablePhone: boolean;
  enableEmail: boolean;
}

export const AuthContainer: React.FC<IAuthContainerProps> = ({ enablePhone, enableEmail }) => {
  const [activeTab, setActiveTab] = useState('phone');

  return (
    <motion.main
      className="flex flex-col items-center gap-8"
      key="vines-login"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2 } }}
      exit={{ opacity: 0 }}
    >
      <Tabs
        id="vines-login-tab"
        defaultValue="phone"
        className="flex w-72 flex-col items-center"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2">
          {enablePhone && <TabsTrigger value="phone">手机号登录</TabsTrigger>}
          {enableEmail && <TabsTrigger value="email">邮箱登录</TabsTrigger>}
        </TabsList>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="w-full"
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -10, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {enablePhone && activeTab === 'phone' && (
              <TabsContent value="phone" className="w-full" forceMount>
                <PhoneAuth />
              </TabsContent>
            )}
            {enableEmail && activeTab === 'email' && (
              <TabsContent value="email" className="w-full" forceMount>
                <EmailAuth />
              </TabsContent>
            )}
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.main>
  );
};
