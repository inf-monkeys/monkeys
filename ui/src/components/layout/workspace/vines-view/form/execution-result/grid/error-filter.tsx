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
        <Button variant="borderless" className="mb-2 hover:bg-slate-1 active:bg-slate-1" icon={<FilterIcon />}>
          {t('workspace.logs-view.log.list.error-filter.title')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom">
        <DropdownMenuCheckboxItem checked={filter} onCheckedChange={setFilterOn}>
          {t('workspace.logs-view.log.list.error-filter.options.yes')}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!filter} onCheckedChange={setFilterOff}>
          {t('workspace.logs-view.log.list.error-filter.options.no')}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
