import { FilterIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useShouldFilterErrorStore } from '@/store/useShouldErrorFilterStore';
export const ErrorFilter = () => {
  const { filter, setFilterOn, setFilterOff } = useShouldFilterErrorStore();
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="borderless" className="hover:bg-slate-1 active:bg-slate-1" icon={<FilterIcon />}>
          {t('workspace.image-detail.error-filter.title')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom">
        <DropdownMenuCheckboxItem checked={filter} onCheckedChange={setFilterOn}>
          {t('workspace.image-detail.error-filter.options.on')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!filter} onCheckedChange={setFilterOff}>
          {t('workspace.image-detail.error-filter.options.off')}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
