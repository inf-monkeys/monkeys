import React, { useState } from 'react';

import { mutate } from 'swr';

import { HardDriveDownload, HardDriveUpload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { updateComfyuiModelsFromInternals, updateComfyuiModelsToInternals } from '@/apis/comfyui-model';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';

interface IImageModelManageDropdownProps {
  children: React.ReactNode;
}

export const ImageModelManageDropdown: React.FC<IImageModelManageDropdownProps> = ({ children }) => {
  const { t } = useTranslation();

  const mutateComfyuiModelsAndTypes = () =>
    mutate((key) => typeof key === 'string' && key.startsWith('/api/comfyui-models'));

  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateToInternals = () => {
    setIsLoading(true);
    toast.promise(updateComfyuiModelsToInternals(), {
      loading: t('common.operate.loading'),
      success: (data) => {
        void mutateComfyuiModelsAndTypes();
        return t('comfyui.utils.toast.update-result', {
          ...data,
        });
      },
      error: t('common.operate.error'),
      finally: () => setIsLoading(false),
    });
  };

  const handleUpdateFromInternals = () => {
    setIsLoading(true);
    toast.promise(updateComfyuiModelsFromInternals(), {
      loading: t('common.operate.loading'),
      success: (data) => {
        void mutateComfyuiModelsAndTypes();
        return t('comfyui.utils.toast.update-result', {
          ...data,
        });
      },
      error: t('common.operate.error'),
      finally: () => setIsLoading(false),
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={handleUpdateToInternals} disabled={isLoading}>
            <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
              <HardDriveDownload size={15} />
            </DropdownMenuShortcut>
            {t('comfyui.comfyui-model.manage-dropdown.options.update-to-internals')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleUpdateFromInternals} disabled={isLoading}>
            <DropdownMenuShortcut className="ml-0 mr-2 mt-0.5">
              <HardDriveUpload size={15} />
            </DropdownMenuShortcut>
            {t('comfyui.comfyui-model.manage-dropdown.options.update-from-internals')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
