"use client";

import { useCallback, useEffect, useRef } from "react";
import { ArrowRight, Globe, Instagram, Twitter } from "lucide-react";

const heroVideo =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4";

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<number | null>(null);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const fadingOutRef = useRef(false);

  const fadeVideo = useCallback((targetOpacity: number) => {
    const video = videoRef.current;
    if (!video) return;

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    const startOpacity = Number.parseFloat(video.style.opacity || "0");
    const startTime = performance.now();

    const animate = (time: number) => {
      const progress = Math.min((time - startTime) / 500, 1);
      const opacity = startOpacity + (targetOpacity - startOpacity) * progress;
      video.style.opacity = String(opacity);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        frameRef.current = null;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
  }, []);

  const handleCanPlay = () => {
    const video = videoRef.current;
    if (!video || startedRef.current) return;

    startedRef.current = true;
    void video.play().catch(() => undefined);
    fadeVideo(1);
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;

    if (video.duration - video.currentTime <= 0.55 && !fadingOutRef.current) {
      fadingOutRef.current = true;
      fadeVideo(0);
    }
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) return;

    video.style.opacity = "0";
    resetTimerRef.current = setTimeout(() => {
      video.currentTime = 0;
      fadingOutRef.current = false;
      void video.play().catch(() => undefined);
      fadeVideo(1);
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover object-bottom"
        style={{ opacity: 0 }}
        src={heroVideo}
        muted
        autoPlay
        playsInline
        preload="auto"
        onCanPlay={handleCanPlay}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />
      <div className="pointer-events-none absolute inset-0 bg-black/20" />

      <header className="relative z-20 px-6 py-6">
        <nav className="liquid-glass mx-auto flex max-w-5xl items-center justify-between rounded-full px-6 py-3">
          <div className="flex items-center">
            <a href="#" className="relative flex items-center gap-2 text-white">
              <Globe className="h-6 w-6" />
              <span className="text-lg font-semibold">Asme</span>
            </a>
            <div className="ml-8 hidden items-center gap-8 md:flex">
              <a href="#features" className="text-sm font-medium text-white/80 transition-colors hover:text-white">
                Features
              </a>
              <a href="#services" className="text-sm font-medium text-white/80 transition-colors hover:text-white">
                Pricing
              </a>
              <a href="#about" className="text-sm font-medium text-white/80 transition-colors hover:text-white">
                About
              </a>
            </div>
          </div>

          <div className="relative flex items-center gap-5">
            <button type="button" className="text-sm font-medium text-white transition-colors hover:text-white/70">
              Sign Up
            </button>
            <button type="button" className="liquid-glass rounded-full px-6 py-2 text-sm font-medium text-white">
              Login
            </button>
          </div>
        </nav>
      </header>

      <div className="relative z-10 flex flex-1 -translate-y-[20%] flex-col items-center justify-center px-6 py-12 text-center">
        <h1 className="font-instrument whitespace-nowrap text-7xl tracking-tight text-white md:text-8xl lg:text-9xl">
          Know it then <em className="italic">all</em>.
        </h1>

        <form className="liquid-glass relative mt-9 flex w-full max-w-xl items-center gap-3 rounded-full py-2 pl-6 pr-2">
          <input
            type="email"
            placeholder="Enter your email"
            aria-label="Email address"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
          />
          <button type="submit" aria-label="Subscribe" className="rounded-full bg-white p-3 text-black transition-transform hover:scale-105">
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>

        <p className="mt-6 max-w-xl px-4 text-sm leading-relaxed text-white">
          Stay updated with the latest news and insights. Subscribe to our newsletter today
          and never miss out on exciting updates.
        </p>

        <button type="button" className="liquid-glass relative mt-8 rounded-full px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5">
          Read our manifesto
        </button>
      </div>

      <div className="relative z-10 flex justify-center gap-4 pb-12">
        {[Instagram, Twitter, Globe].map((Icon, index) => (
          <button
            type="button"
            aria-label={["Instagram", "Twitter", "Website"][index]}
            className="liquid-glass rounded-full p-4 text-white/80 transition-all hover:bg-white/5 hover:text-white"
            key={index}
          >
            <Icon className="relative h-5 w-5" />
          </button>
        ))}
      </div>
    </section>
  );
}
