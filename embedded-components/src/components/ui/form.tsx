import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from 'react-hook-form';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

type FormItemContextValue = {
  id: string;
  hasDescription: boolean;
  hasMessage: boolean;
  registerDescription: () => () => void;
  registerMessage: () => () => void;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

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
    formLabelId: `${id}-form-item-label`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();
  const [hasDescription, setHasDescription] = React.useState(false);
  const [hasMessage, setHasMessage] = React.useState(false);

  const registerDescription = React.useCallback(() => {
    setHasDescription(true);
    return () => setHasDescription(false);
  }, []);

  const registerMessage = React.useCallback(() => {
    setHasMessage(true);
    return () => setHasMessage(false);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      id,
      hasDescription,
      hasMessage,
      registerDescription,
      registerMessage,
    }),
    [id, hasDescription, hasMessage, registerDescription, registerMessage]
  );

  return (
    <FormItemContext.Provider value={contextValue}>
      <div ref={ref} className={cn('eb-space-y-2', className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = 'FormItem';

interface FormLabelPropsRef
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  asterisk?: boolean;
}

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  FormLabelPropsRef
>(({ className, asterisk, ...props }, ref) => {
  const { error, formItemId, formLabelId } = useFormField();
  return (
    <Label
      ref={ref}
      id={formLabelId}
      className={cn(
        error && '!eb-text-destructive',
        asterisk && `after:eb-text-red-500 after:eb-content-["_*"]`,
        'eb-text-label eb-font-label eb-text-label-foreground',
        className
      )}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = 'FormLabel';

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formLabelId, formDescriptionId, formMessageId } =
    useFormField();
  const { hasDescription, hasMessage } = React.useContext(FormItemContext);

  const describedByIds = [
    hasDescription ? formDescriptionId : undefined,
    error && hasMessage ? formMessageId : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={describedByIds || undefined}
      aria-invalid={!!error}
      aria-labelledby={formLabelId}
      {...props}
    />
  );
});
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();
  const { registerDescription } = React.useContext(FormItemContext);

  React.useEffect(() => registerDescription(), [registerDescription]);

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('eb-text-sm eb-text-muted-foreground', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const { registerMessage } = React.useContext(FormItemContext);
  const body = error ? (
    <>
      {'\u24d8'} {error?.message ?? ''}{' '}
    </>
  ) : (
    children
  );

  React.useEffect(() => {
    if (body) return registerMessage();
    return undefined;
  }, [body, registerMessage]);

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn(
        'eb-text-[0.8rem] eb-font-medium eb-text-destructive',
        className
      )}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = 'FormMessage';

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
