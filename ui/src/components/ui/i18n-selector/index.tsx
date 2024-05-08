import React from 'react';

import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx';
import { LANGUAGES_LIST } from '@/components/ui/i18n-selector/consts.ts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const I18nSelector: React.FC = () => {
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;

  const handleToggle = (lang: string) => {
    toast.promise(i18n.changeLanguage(lang), {
      loading: t('common.language-selector.switching'),
      success: t('common.language-selector.switched'),
      error: t('common.language-selector.switch-failed'),
    });
  };

  return (
    <Tooltip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="outline" icon={<Languages />} />
          </TooltipTrigger>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            {LANGUAGES_LIST.map(([lang, displayName]) => (
              <DropdownMenuCheckboxItem
                key={lang}
                checked={currentLanguage === lang}
                onCheckedChange={() => handleToggle(lang)}
              >
                {displayName}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <TooltipContent>{t('common.language-selector.tooltip')}</TooltipContent>
    </Tooltip>
  );
};
