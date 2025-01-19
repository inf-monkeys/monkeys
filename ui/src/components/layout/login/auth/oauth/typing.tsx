import React from 'react';

import { FeishuIcon } from '@/assets/icons/feishu';
import { WeWorkIcon } from '@/assets/icons/wework.tsx';
import { OAuthWeWorkProvider } from '@/components/layout/login/auth/oauth/wework.tsx';
import { OAuthFeishuProvider } from './feishu';

export const OAuthProvider: {
  [key: string]: {
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    name: string;
    Provider: React.FC<React.ComponentPropsWithoutRef<'div'>>;
  };
} = {
  wework: {
    icon: WeWorkIcon,
    name: 'auth.oauth.wework.label',
    Provider: OAuthWeWorkProvider,
  },
  feishu: {
    icon: FeishuIcon as any,
    name: 'auth.oauth.feishu.label',
    Provider: OAuthFeishuProvider,
  },
};
