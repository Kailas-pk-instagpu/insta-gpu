import { useEffect, useState } from 'react';

/**
 * Triggers a brief "loading" pulse whenever any of the supplied dependencies change.
 * Useful for showing loading skeletons when filters are applied or pages are switched.
 */
export function useDeferredLoading(deps: ReadonlyArray<unknown>, durationMs = 350): boolean {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const id = setTimeout(() => setLoading(false), durationMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return loading;
}
