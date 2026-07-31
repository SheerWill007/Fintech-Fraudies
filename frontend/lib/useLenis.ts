'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Custom hook to access and control Lenis scroll instance
 * 
 * @example
 * ```tsx
 * const lenis = useLenis((lenis) => {
 *   // This callback runs on every scroll frame
 *   console.log('scroll', lenis.scroll);
 * });
 * 
 * // Scroll to top
 * lenis?.scrollTo(0);
 * 
 * // Scroll to element
 * lenis?.scrollTo('#section-id');
 * 
 * // Stop scrolling
 * lenis?.stop();
 * 
 * // Start scrolling
 * lenis?.start();
 * ```
 */
export function useLenis(callback?: (lenis: Lenis) => void, deps: any[] = []) {
  useEffect(() => {
    const handleScroll = (lenis: Lenis) => {
      callback?.(lenis);
    };

    // Get the Lenis instance from window (set by LenisProvider)
    const lenis = (window as any).lenis as Lenis | undefined;

    if (lenis && callback) {
      lenis.on('scroll', handleScroll);
      return () => {
        lenis.off('scroll', handleScroll);
      };
    }
  }, deps);

  return (window as any).lenis as Lenis | undefined;
}
