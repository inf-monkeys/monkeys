import React from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  composeRenderProps,
  Input as AriaInput,
  InputProps as AriaInputProps,
  NumberField as AriaNumberField,
} from 'react-aria-components';

import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/utils';

const NumberField = AriaNumberField;

function NumberFieldInput({ className, ...props }: AriaInputProps) {
  return (
    <AriaInput
      className={composeRenderProps(className, (className) =>
        cn(
          'w-fit min-w-0 flex-1 border-r border-transparent bg-background pr-2 outline outline-0 placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden',
          className,
        ),
      )}
      {...props}
    />
  );
}

function NumberFieldSteppers({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('absolute right-0 flex h-full flex-col border-l', className)} {...props}>
      <NumberFieldStepper slot="increment">
        <ChevronUp aria-hidden className="size-4" />
      </NumberFieldStepper>
      <div className="border-b" />
      <NumberFieldStepper slot="decrement">
        <ChevronDown aria-hidden className="size-4" />
      </NumberFieldStepper>
    </div>
  );
}

function NumberFieldStepper({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={
        composeRenderProps(className, (className) =>
          cn('w-auto grow rounded-none px-0.5 text-muted-foreground', className),
        ) as unknown as string
      }
      variant="ghost"
      size="icon"
      {...props}
    />
  );
}

export { NumberField, NumberFieldInput, NumberFieldStepper, NumberFieldSteppers };
