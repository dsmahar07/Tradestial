import * as React from 'react'

export function recursiveCloneChildren(
  children: React.ReactNode,
  sharedProps: Record<string, any>,
  targetDisplayNames: string[],
  uniqueId: string,
  asChild?: boolean
): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) {
      return child
    }

    // Check if this child should receive the shared props
    const shouldReceiveProps = targetDisplayNames.some(
      (name) => child.type && typeof child.type === 'function' && (child.type as any).displayName === name
    )

    let clonedChild = child
    
    if (shouldReceiveProps) {
      clonedChild = React.cloneElement(child, {
        ...sharedProps,
        ...(child.props || {}),
        key: child.key || `${uniqueId}-${targetDisplayNames.indexOf((child.type as any)?.displayName || '')}`
      })
    }

    // Recursively clone children if they exist
    if ((clonedChild.props as any)?.children) {
      clonedChild = React.cloneElement(clonedChild, {
        ...(clonedChild.props || {}),
        children: recursiveCloneChildren(
          (clonedChild.props as any).children,
          sharedProps,
          targetDisplayNames,
          uniqueId,
          asChild
        )
      } as any)
    }

    return clonedChild
  })
}