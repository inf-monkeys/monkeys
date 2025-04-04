'use client';

import React, { useState } from 'react';

import { addDays, format } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/utils';

interface IDatePickerWithRangeProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'onChange'> {
  initialDate?: DateRange;
  onChange?: (date: DateRange) => void;
}

export const DatePickerWithRange: React.FC<IDatePickerWithRangeProps> = ({ className, initialDate, onChange }) => {
  const { t, i18n } = useTranslation();

  const [date, setDate] = useState<DateRange | undefined>(
    initialDate
      ? initialDate
      : {
          from: new Date(2024, 0, 20),
          to: addDays(new Date(2024, 0, 20), 20),
        },
  );

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn('w-[300px] justify-start text-left font-normal', !date && 'text-muted-foreground')}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                i18n.language === 'zh' ? (
                  <>
                    {format(date.from, 'y 年 LLL dd 日', { locale: zhCN })} -{' '}
                    {format(date.to, 'y 年 LLL dd 日', { locale: zhCN })}
                  </>
                ) : (
                  <>
                    {format(date.from, 'dd/MM/y', { locale: enUS })} - {format(date.to, 'dd/MM/y', { locale: enUS })}
                  </>
                )
              ) : i18n.language === 'zh' ? (
                format(date.from, 'y 年 LLL dd 日', { locale: zhCN })
              ) : (
                format(date.from, 'dd/MM/y', { locale: enUS })
              )
            ) : (
              <span>{t('components.ui.date-range-picker.select-date')}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(newDate) => {
              setDate(newDate);
              newDate && onChange?.(newDate);
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
