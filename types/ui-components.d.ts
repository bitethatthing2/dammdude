/**
 * Type declarations for UI components
 */

// Scroll Area component
declare module '@/components/ui/scroll-area' {
  import { ReactNode, ComponentPropsWithoutRef } from 'react';
  
  export interface ScrollAreaProps extends ComponentPropsWithoutRef<'div'> {
    children: ReactNode;
    className?: string;
  }
  
  export const ScrollArea: React.FC<ScrollAreaProps>;
  export const ScrollBar: React.FC<ComponentPropsWithoutRef<'div'>>;
}

// Skeleton component
declare module '@/components/ui/skeleton' {
  import { ComponentPropsWithoutRef } from 'react';
  
  export interface SkeletonProps extends ComponentPropsWithoutRef<'div'> {
    className?: string;
  }
  
  export const Skeleton: React.FC<SkeletonProps>;
}

// Form components
declare module '@/components/ui/form' {
  import { ReactNode, ComponentPropsWithoutRef } from 'react';
  import { UseFormReturn, FieldPath, FieldValues, Controller } from 'react-hook-form';
  
  export interface FormProps<TFieldValues extends FieldValues> 
    extends ComponentPropsWithoutRef<'form'> {
    form: UseFormReturn<TFieldValues>;
  }
  
  export interface FormFieldProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
  > {
    name: TName;
    control?: UseFormReturn<TFieldValues>['control'];
    render: (props: { field: any }) => ReactNode;
  }
  
  export const Form: <TFieldValues extends FieldValues>(
    props: FormProps<TFieldValues>
  ) => JSX.Element;
  
  export const FormField: <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
  >(
    props: FormFieldProps<TFieldValues, TName>
  ) => JSX.Element;
  
  export const FormItem: React.FC<ComponentPropsWithoutRef<'div'>>;
  export const FormLabel: React.FC<ComponentPropsWithoutRef<'label'>>;
  export const FormControl: React.FC<{ children: ReactNode }>;
  export const FormDescription: React.FC<ComponentPropsWithoutRef<'p'>>;
  export const FormMessage: React.FC<ComponentPropsWithoutRef<'p'>>;
}
