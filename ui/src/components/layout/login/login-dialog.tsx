import React from 'react';

import { get } from 'lodash';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common';
import { VinesUserLogin } from '@/components/layout/login';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppLogo } from '@/components/ui/logo';
import { useAppStore } from '@/store/useAppStore';

interface ILoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginFinished?: () => void;
}

interface ILoginDialogContentProps {
  hideCloseButton?: boolean;
}

export const LoginDialog: React.FC<ILoginDialogProps & ILoginDialogContentProps> = ({ 
  open, 
  onOpenChange, 
  onLoginFinished,
  hideCloseButton = false 
}) => {
  const { t } = useTranslation();
  const darkMode = useAppStore((s) => s.darkMode);
  const { data: oem } = useSystemConfig();

  const logoUrl = get(oem, `theme.logo.${darkMode ? 'dark' : 'light'}`, '');
  const appName = get(oem, 'theme.name', 'AI');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`max-w-md ${hideCloseButton ? '[&>button]:hidden' : ''}`}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex flex-col items-center gap-4">
            <AppLogo url={logoUrl} alt={appName} height={36} />
            <span>{t('auth.login-to-continue')}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <VinesUserLogin otherAuthMethods={true} onLoginFinished={onLoginFinished} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
