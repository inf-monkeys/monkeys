import React from 'react';

import { WeWorkIcon } from '@/assets/icons/wework.tsx';
import { OAuthWeWorkProvider } from '@/components/layout/login/auth/oauth/wework.tsx';

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
};
