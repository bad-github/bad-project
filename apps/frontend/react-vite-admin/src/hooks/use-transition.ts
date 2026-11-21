import {useState} from 'react';

type TransitionState = [boolean, (callback: () => void) => void];

/**
 * 在低于react18版本下模拟useTransition
 */
export default function useTransition(): TransitionState {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = (callback: () => void) => {
    setIsTransitioning(true);
    if (window['requestIdleCallback']) {
      requestIdleCallback(() => {
        callback();
        setIsTransitioning(false);
      });
    } else {
      requestAnimationFrame(() => {
        setTimeout(() => {
          callback();
          setIsTransitioning(false);
        });
      });
    }
  };

  return [isTransitioning, startTransition];
}
