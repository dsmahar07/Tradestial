import * as React from 'react';

// Supports an own-props generic so consumers can pass component-specific props
// while still forwarding valid props for the rendered element via `as`.
export type PolymorphicComponentProps<
  T extends React.ElementType,
  OwnProps = {}
> = OwnProps & {
  as?: T;
} & Omit<React.ComponentPropsWithoutRef<T>, keyof OwnProps | 'as'>;
