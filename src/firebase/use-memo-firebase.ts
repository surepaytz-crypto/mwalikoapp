'use client';

import { useMemo, useRef } from 'react';

/**
 * A hook to stabilize Firebase references and queries.
 * It ensures that the same instance is returned as long as the dependencies don't change,
 * preventing infinite render loops in useCollection and useDoc.
 */
export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
