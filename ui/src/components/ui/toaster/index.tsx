import { useSystemConfig } from '@/apis/common';
import { Toaster as SonnerToaster } from 'sonner';

export const Toaster = () => {
  const { data: oem } = useSystemConfig();

  const toastConfig = oem?.theme.toast;

  return (
    <SonnerToaster
      richColors
      closeButton
      visibleToasts={10}
      className="pointer-events-auto"
      position={toastConfig?.position}
    />
  );
};
