import { logger } from '@/lib/logger'

// AlignUI FancyButton v0.0.0

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { PolymorphicComponentProps } from '@/utils/polymorphic';
import { recursiveCloneChildren } from '@/utils/recursive-clone-children';
import { tv, type VariantProps } from '@/utils/tv';

const FANCY_BUTTON_ROOT_NAME = 'FancyButtonRoot';
const FANCY_BUTTON_ICON_NAME = 'FancyButtonIcon';

export const fancyButtonVariants = tv({
  slots: {
    root: [
      // base
      'group relative inline-flex items-center justify-center whitespace-nowrap text-sm font-medium outline-none',
      'transition duration-200 ease-out',
      // focus
      'focus:outline-none',
      // disabled
      'disabled:pointer-events-none disabled:text-gray-400',
      'disabled:bg-gray-100 disabled:bg-none disabled:shadow-none disabled:before:hidden disabled:after:hidden',
    ],
    icon: 'relative z-10 w-5 h-5 shrink-0',
  },
  variants: {
    variant: {
      neutral: {
        root: 'bg-gray-900 hover:bg-gray-800 text-white shadow-xl',
      },
      primary: {
        root: 'bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-xl',
      },
      destructive: {
        root: 'bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-xl',
      },
      basic: {
        root: [
          // base
          'bg-white text-gray-600 border border-gray-200',
          // dark theme
          'dark:bg-[#0f0f0f] dark:text-gray-300 dark:border-[#404040]',
          // hover
          'hover:bg-gray-50 hover:text-gray-900',
          // dark hover
          'dark:hover:bg-[#1a1a1a] dark:hover:text-white',
        ],
      },
    },
    size: {
      medium: {
        root: 'h-10 gap-3 rounded-lg px-3.5',
        icon: '-mx-1',
      },
      small: {
        root: 'h-9 gap-3 rounded-lg px-3',
        icon: '-mx-1',
      },
      xsmall: {
        root: 'h-8 gap-3 rounded-lg px-2.5',
        icon: '-mx-1',
      },
    },
  },
  compoundVariants: [
    {
      variant: ['neutral', 'primary', 'destructive'],
      class: {
        root: [
          // before
          'before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-[inherit]',
          'before:bg-gradient-to-b before:p-px',
          'before:from-white/20 before:to-transparent',
          // after
          'after:absolute after:inset-0 after:rounded-[inherit] after:bg-gradient-to-b after:from-white after:to-transparent',
          'after:pointer-events-none after:opacity-10 after:transition after:duration-200 after:ease-out',
          // hover
          'hover:after:opacity-20',
        ],
      },
    },
  ],
  defaultVariants: {
    variant: 'neutral',
    size: 'medium',
  },
});

type FancyButtonSharedProps = VariantProps<typeof fancyButtonVariants>;

type FancyButtonProps = VariantProps<typeof fancyButtonVariants> &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    asChild?: boolean;
  };

const FancyButtonRoot = React.forwardRef<HTMLButtonElement, FancyButtonProps>(
  ({ asChild, children, variant, size, className, ...rest }, forwardedRef) => {
    const uniqueId = React.useId();
    const Component = asChild ? Slot : 'button';
    
    try {
      const variants = fancyButtonVariants({ variant, size });
      const rootClassName = (variants as any).root({ class: className });

      const sharedProps: FancyButtonSharedProps = {
        variant,
        size,
      };

      const extendedChildren = recursiveCloneChildren(
        children as React.ReactElement[],
        sharedProps,
        [FANCY_BUTTON_ICON_NAME],
        uniqueId,
        asChild as boolean,
      );

      return (
        <Component
          ref={forwardedRef}
          className={rootClassName}
          {...rest}
        >
          {extendedChildren}
        </Component>
      );
    } catch (error) {
      logger.error('FancyButton error:', error);
      // Fallback to basic button if variants fail
      return (
        <Component
          ref={forwardedRef}
          className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            variant === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
            variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700' :
            'bg-gray-900 text-white hover:bg-gray-800'
          } ${className || ''}`}
          {...rest}
        >
          {children as React.ReactNode}
        </Component>
      );
    }
  },
);
FancyButtonRoot.displayName = FANCY_BUTTON_ROOT_NAME;

function FancyButtonIcon<T extends React.ElementType>({
  className,
  variant,
  size,
  as,
  ...rest
}: PolymorphicComponentProps<T, FancyButtonSharedProps>) {
  const Component = as || 'div';
  const { icon } = fancyButtonVariants({ variant, size }) as any;

  return <Component className={icon({ class: className })} {...rest} />;
}
FancyButtonIcon.displayName = FANCY_BUTTON_ICON_NAME;

export { FancyButtonRoot as Root, FancyButtonIcon as Icon };