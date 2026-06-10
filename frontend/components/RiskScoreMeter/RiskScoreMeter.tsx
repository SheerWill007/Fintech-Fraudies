'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface RiskScoreMeterProps {
  score: number; // 0.0 to 1.0
}

export default function RiskScoreMeter({ score }: RiskScoreMeterProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  
  const percentage = Math.round(score * 100);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score * circumference);

  useEffect(() => {
    if (circleRef.current) {
      gsap.fromTo(
        circleRef.current,
        { strokeDashoffset: circumference },
        { strokeDashoffset, duration: 1.2, ease: 'power3.out' }
      );
    }
    if (textRef.current) {
      const obj = { val: 0 };
      gsap.to(obj, {
        val: percentage,
        duration: 1.2,
        ease: 'power3.out',
        onUpdate: () => {
          if (textRef.current) {
            textRef.current.textContent = `${Math.round(obj.val)}%`;
          }
        }
      });
    }
  }, [score, circumference, strokeDashoffset, percentage]);

  const getColor = () => {
    if (score >= 0.7) return 'stroke-red-500 text-red-500';
    if (score >= 0.4) return 'stroke-amber-500 text-amber-500';
    return 'stroke-emerald-500 text-emerald-500';
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="stroke-zinc-800"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            ref={circleRef}
            cx="64"
            cy="64"
            r={radius}
            className={`transition-colors ${getColor().split(' ')[0]}`}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span ref={textRef} className={`text-2xl font-bold ${getColor().split(' ')[1]}`}>
            0%
          </span>
          <span className="text-[10px] uppercase text-zinc-500 font-semibold tracking-wider">
            Risk Score
          </span>
        </div>
      </div>
    </div>
  );
}
