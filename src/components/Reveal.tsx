import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

/**
 * Decorative scroll reveal.
 *
 * Fail-safe by design: content is never permanently hidden. The previous version
 * used a 5% intersection threshold, which is impossible to reach for a tall
 * single-column grid (on a 390px phone the tools section is ~21,000px tall, so
 * the maximum visible ratio is ~4%). That left the whole toolkit at opacity 0.
 *
 * Rules now:
 * - threshold 0, so any intersection reveals;
 * - immediately visible when the element is taller than the viewport;
 * - a timer reveals it regardless after 1.2s;
 * - reduced-motion users start visible;
 * - IntersectionObserver failures/absence leave content visible.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    // Tall blocks can never satisfy a percentage threshold; show them at once.
    if (element.offsetHeight > window.innerHeight) {
      setVisible(true);
      return;
    }

    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setVisible(true);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10px 0px", threshold: 0 }
    );
    observer.observe(element);

    // Hard safety net: never let decoration hide content.
    const fallback = window.setTimeout(show, 1200);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ transitionDelay: visible ? `${Math.min(delay, 200)}ms` : undefined }}
    >
      {children}
    </div>
  );
}
