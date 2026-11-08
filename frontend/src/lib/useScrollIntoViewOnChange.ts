import { RefObject, useEffect, useRef } from 'react';

/**
 * When `value` changes (a tab, a form step, a page of results…), bring `ref`'s element to
 * just below the sticky navigation bar — but only if the user has scrolled past it, so the
 * new content starts at its beginning instead of wherever the old content left off.
 * Does nothing on the first render.
 */
export function useScrollIntoViewOnChange(ref: RefObject<HTMLElement | null>, value: unknown) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const el = ref.current;
    if (!el) return;

    const nav = document.getElementById('platform-navbar');
    const navHeight = nav ? nav.offsetHeight : 0;
    const top = el.getBoundingClientRect().top;

    // Already comfortably in view: leave the page where it is
    if (top >= navHeight && top < window.innerHeight / 2) return;

    window.scrollTo({ top: window.scrollY + top - navHeight - 12, behavior: 'smooth' });
  }, [value, ref]);
}
