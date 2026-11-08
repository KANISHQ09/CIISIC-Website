import { useEffect } from 'react';

/** Sets the browser-tab title for a page, e.g. "About · CIISIC". */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · CIISIC` : 'CIISIC Platform';
    return () => {
      document.title = previous;
    };
  }, [title]);
}
