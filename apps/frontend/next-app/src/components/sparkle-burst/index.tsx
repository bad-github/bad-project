'use client';

import {type ReactNode, useState} from 'react';
import {cn} from '@badnpm/ui';
import styles from './sparkle-burst.module.css';

type SparkleBurstProps = {
  children: ReactNode;
  className?: string;
  trigger?: 'click' | 'loop';
};

const particleCount = 8;

/**
 * 为内部的按钮或链接添加固定轨迹的 CSS 星光爆发效果。
 * 内部元素继续负责点击行为和无障碍语义，本组件只监听冒泡事件并播放装饰动画。
 */
export default function SparkleBurst({children, className, trigger = 'click'}: SparkleBurstProps) {
  const [burstId, setBurstId] = useState(0);
  const shouldRenderParticles = trigger === 'loop' || burstId > 0;

  return (
    <span
      className={cn(styles.root, className)}
      onClick={trigger === 'click' ? () => setBurstId((current) => current + 1) : undefined}
    >
      {children}
      {shouldRenderParticles && (
        <span key={burstId} className={cn(styles.particles, trigger === 'loop' && styles.loop)} aria-hidden="true">
          {Array.from({length: particleCount}, (_, index) => (
            <span key={index} className={styles.particle}>
              ✦
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
