// Scroll-reveal wrapper driven by IntersectionObserver (no animation library).
// Reveals once by default; cleans up its observer on unmount.
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../utils/cn.js';

export function Reveal({
  children,
  className,
  delay = 0,
  direction = 'up', // up | left | right | scale
  as: Tag = 'div',
  once = true,
  ...props
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    // Respect users who disable non-essential motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return undefined;
    }
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      className={cn(
        'reveal',
        direction === 'left' && 'reveal-left',
        direction === 'right' && 'reveal-right',
        direction === 'scale' && 'reveal-scale',
        visible && 'is-visible',
        className
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
