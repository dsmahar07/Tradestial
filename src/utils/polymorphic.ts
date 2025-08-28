import * as React from 'react';

export type PolymorphicComponentProps<T extends React.ElementType> = {
  as?: T;
} & React.ComponentPropsWithoutRef<T>;
