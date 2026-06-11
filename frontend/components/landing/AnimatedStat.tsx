'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedStatProps {
  value: string;
  label: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedStat({ value, label, prefix = '', suffix = '' }: AnimatedStatProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div ref={ref} className="text-center">
      <div
        className={`mb-1 text-3xl font-bold text-emerald-500 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {prefix}
        {value}
        {suffix}
      </div>
      <div
        className={`text-sm text-white/50 transition-all duration-700 delay-100 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {label}
      </div>
    </div>
  );
}
