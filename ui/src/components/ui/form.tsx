/* eslint-disable react-refresh/only-export-components */
import * as React from 'react';

import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import { cva, VariantProps } from 'class-variance-authority';
import { get } from 'lodash';
import { composeRenderProps, Group as AriaGroup, GroupProps as AriaGroupProps } from 'react-aria-components';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSystemConfig } from '@/apis/common/index.ts';
import { ISystemConfig } from '@/apis/common/typings';
import { Label } from '@/components/ui/label';
import { SmoothTransition } from '@/components/ui/smooth-transition-size/SmoothTransition.tsx';
import { cn } from '@/utils/index.ts';

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { card?: boolean }>(
  ({ className, card = false, ...props }, ref) => {
    const id = React.useId();
    const { data: systemConfig } = useSystemConfig();
    const formVariant = get(systemConfig, 'theme.form.variant', 'bento') as 'bento' | 'ghost';

    const shouldApplyCardStyle = card && formVariant === 'bento';

    return (
      <FormItemContext.Provider value={{ id }}>
        <div
          ref={ref}
          className={cn(
            formVariant === 'bento' ? 'space-y-4' : 'space-y-2',
            shouldApplyCardStyle && 'rounded-lg bg-neocard px-global pt-global text-[#3F3E39] dark:text-[#EDEDED]',
            className,
          )}
          {...props}
        />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = 'FormItem';

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, children, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  const { data: systemConfig } = useSystemConfig();
  const formVariant = get(systemConfig, 'theme.form.variant', 'bento') as 'bento' | 'ghost';
  const themeGradient = get(systemConfig, 'theme.gradient', undefined) as ISystemConfig['theme']['gradient'];
  return (
    <Label
      ref={ref}
      className={cn(
        'flex items-center gap-2 font-medium text-[#3F3E39] dark:text-[#EDEDED]',
        error && 'text-destructive',
        className,
      )}
      htmlFor={formItemId}
      {...props}
    >
      {formVariant === 'ghost' && (
        <span
          className={cn(
            'ml-global-1/2 inline-block size-2 rounded-full',
            themeGradient ? 'bg-gradient' : 'bg-vines-500',
          )}
        />
      )}
      {children}
    </Label>
  );
});
FormLabel.displayName = 'FormLabel';

const FormControl = React.forwardRef<React.ElementRef<typeof Slot>, React.ComponentPropsWithoutRef<typeof Slot>>(
  ({ ...props }, ref) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

    return (
      <Slot
        ref={ref}
        id={formItemId}
        aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
        aria-invalid={!!error}
        {...props}
      />
    );
  },
);
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField();

    return (
      <p
        ref={ref}
        id={formDescriptionId}
        className={cn('text-xs text-[#3F3E39]/70 dark:text-[#EDEDED]/70', className)}
        {...props}
      />
    );
  },
);
FormDescription.displayName = 'FormDescription';

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { t } = useTranslation();
    const { error, formMessageId } = useFormField();
    const body = error && !children ? t(String(error?.message)) : children;

    return (
      <SmoothTransition>
        {body && (
          <p ref={ref} id={formMessageId} className={cn('text-xs font-medium text-destructive', className)} {...props}>
            {body}
          </p>
        )}
      </SmoothTransition>
    );
  },
);
FormMessage.displayName = 'FormMessage';

const fieldGroupVariants = cva('', {
  variants: {
    variant: {
      default: [
        'relative flex h-10 w-full items-center overflow-hidden rounded-md border border-input bg-[#FFFFFF] dark:bg-[#111113] px-3 py-2 text-sm ring-offset-background',
        /* Focus Within */
        'data-[focus-within]:outline-none data-[focus-within]:ring-2 data-[focus-within]:ring-vines-500 data-[focus-within]:ring-offset-2',
        /* Disabled */
        'data-[disabled]:opacity-50',
      ],
      ghost: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface GroupProps extends AriaGroupProps, VariantProps<typeof fieldGroupVariants> {}

function FieldGroup({ className, variant, ...props }: GroupProps) {
  return (
    <AriaGroup
      className={composeRenderProps(className, (className) => cn(fieldGroupVariants({ variant }), className))}
      {...props}
    />
  );
}

const useFormValues = () => {
  const { getValues } = useFormContext();

  return {
    ...useWatch(),
    ...getValues(),
  };
};

export {
  FieldGroup,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
  useFormValues,
};
