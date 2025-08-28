// AlignUI FileUpload v0.0.0

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from '@/lib/utils';
import { PolymorphicComponentProps } from '@/utils/polymorphic';

const FileUpload = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & {
    asChild?: boolean;
  }
>(({ className, asChild, ...rest }, forwardedRef) => {
  const Component = asChild ? Slot : 'label';

  return (
    <Component
      ref={forwardedRef}
      className={cn(
        'flex w-full cursor-pointer flex-col items-center gap-5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-[#171717] p-8 text-center',
        'transition duration-200 ease-out',
        // hover
        'hover:bg-gray-50 dark:hover:bg-gray-800/50',
        className,
      )}
      {...rest}
    />
  );
});
FileUpload.displayName = 'FileUpload';

const FileUploadButton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    asChild?: boolean;
  }
>(({ className, asChild, ...rest }, forwardedRef) => {
  const Component = asChild ? Slot : 'div';

  return (
    <Component
      ref={forwardedRef}
      className={cn(
        'inline-flex h-8 items-center justify-center gap-2.5 whitespace-nowrap rounded-lg bg-white dark:bg-gray-800 px-2.5 text-sm text-gray-600 dark:text-gray-400',
        'pointer-events-none ring-1 ring-inset ring-gray-200 dark:ring-gray-600',
        className,
      )}
      {...rest}
    />
  );
});
FileUploadButton.displayName = 'FileUploadButton';

function FileUploadIcon<T extends React.ElementType>({
  className,
  as,
  ...rest
}: PolymorphicComponentProps<T>) {
  const Component = as || 'div';

  return (
    <Component
      className={cn('size-6 text-gray-400 dark:text-gray-500', className)}
      {...rest}
    />
  );
}

export {
  FileUpload as Root,
  FileUploadButton as Button,
  FileUploadIcon as Icon,
};
