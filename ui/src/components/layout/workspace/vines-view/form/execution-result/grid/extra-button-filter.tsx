import { FilterIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useShouldShowFormButtonStore } from '@/store/useShouldShowFormButton';

export const ExtraButtonFilter = () => {
  const { shouldShow, setShouldShowFormButtonOn, setShouldShowFormButtonOff } = useShouldShowFormButtonStore();
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="borderless" className="mb-2 hover:bg-slate-1 active:bg-slate-1" icon={<FilterIcon />}>
          {t('workspace.image-detail.button-filter.title')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom">
        <DropdownMenuCheckboxItem checked={shouldShow} onCheckedChange={setShouldShowFormButtonOn}>
          {t('workspace.image-detail.error-filter.options.on')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!shouldShow} onCheckedChange={setShouldShowFormButtonOff}>
          {t('workspace.image-detail.error-filter.options.off')}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
