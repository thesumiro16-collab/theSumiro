import { useEffect, useRef, useState } from 'react';

/**
 * Reveal — wraps children and animates them into view on scroll.
 * Respects prefers-reduced-motion (shows content immediately).
 *
 * Props:
 *  - as: element/tag to render (default 'div')
 *  - variant: 'up' | 'fade' | 'scale' | 'left' | 'right'  (default 'up')
 *  - delay: ms delay before animating (default 0)
 *  - className, style: forwarded to wrapper
 */
export default function Reveal({
  as: Tag = 'div',
  variant = 'up',
  delay = 0,
  once = true,
  className = '',
  style = {},
  children,
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const hidden = {
    up: 'translateY(28px)',
    fade: 'none',
    scale: 'scale(0.96)',
    left: 'translateX(-32px)',
    right: 'translateX(32px)',
  }[variant];

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : hidden,
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: 'opacity, transform',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
