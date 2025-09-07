import { useEffect, useRef } from 'react';

/**
 * Custom hook for managing event listeners with automatic cleanup
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: Element | Window | Document | null,
  options?: boolean | AddEventListenerOptions
) {
  // Create a ref that stores handler
  const savedHandler = useRef<(event: WindowEventMap[K]) => void>();

  // Update ref.current value if handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Define the listening target
    const targetElement: Element | Window | Document = element ?? window;
    
    if (!(targetElement && targetElement.addEventListener)) {
      return;
    }

    // Create event listener that calls handler function stored in ref
    const eventListener = (event: Event) => {
      if (savedHandler.current) {
        savedHandler.current(event as WindowEventMap[K]);
      }
    };

    targetElement.addEventListener(eventName, eventListener, options);

    // Remove event listener on cleanup
    return () => {
      targetElement.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}

/**
 * Hook for managing custom events with cleanup
 */
export function useCustomEventListener<T = any>(
  eventName: string,
  handler: (event: CustomEvent<T>) => void,
  element?: Element | Window | Document | null
) {
  const savedHandler = useRef<(event: CustomEvent<T>) => void>();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement: Element | Window | Document = element ?? window;
    
    if (!(targetElement && targetElement.addEventListener)) {
      return;
    }

    const eventListener = (event: Event) => {
      if (savedHandler.current) {
        savedHandler.current(event as CustomEvent<T>);
      }
    };

    targetElement.addEventListener(eventName, eventListener);

    return () => {
      targetElement.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}

/**
 * Hook for cleanup functions that run on component unmount
 */
export function useCleanup(cleanup: () => void, deps: React.DependencyList = []) {
  useEffect(() => {
    return cleanup;
  }, deps);
}
