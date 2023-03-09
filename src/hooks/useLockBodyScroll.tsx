import { disableBodyScroll, enableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';
import { useEffect } from 'react';

export default function useLockBodyScroll(ref: React.RefObject<HTMLElement>, isVisible: boolean) {
  useEffect(() => {
    if (ref?.current) {
      isVisible ? disableBodyScroll(ref.current) : enableBodyScroll(ref.current);
    }
    return () => clearAllBodyScrollLocks();
  }, [ref, isVisible]);
}
