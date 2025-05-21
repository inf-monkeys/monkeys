import { FilterIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useShouldErrorFilterStore } from '@/store/useShouldErrorFilterStore';
export const ErrorFilter = () => {
  const { filter, setFilterOn, setFilterOff } = useShouldErrorFilterStore();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="borderless" className="mb-2 hover:bg-slate-1 active:bg-slate-1" icon={<FilterIcon />}>
          过滤错误
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom">
        <DropdownMenuCheckboxItem checked={filter} onCheckedChange={setFilterOn}>
          是
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={!filter} onCheckedChange={setFilterOff}>
          否
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
