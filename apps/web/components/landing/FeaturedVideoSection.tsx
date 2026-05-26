"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const featuredVideo =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4";

export function FeaturedVideoSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" ref={ref} className="overflow-hidden bg-black px-6 pb-20 pt-6 md:pb-32 md:pt-10">
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.9 }}
        className="relative mx-auto aspect-video max-w-6xl overflow-hidden rounded-3xl"
      >
        <video
          className="h-full w-full object-cover"
          src={featuredVideo}
          muted
          autoPlay
          loop
          playsInline
          preload="auto"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-start justify-between gap-5 p-6 md:flex-row md:items-end md:p-10">
          <div className="liquid-glass rounded-2xl p-6 md:max-w-md md:p-8">
            <p className="relative mb-3 text-xs uppercase tracking-[0.3em] text-white/50">Our Approach</p>
            <p className="relative text-sm leading-relaxed text-white md:text-base">
              We believe in the power of curiosity-driven exploration. Every project
              starts with a question, and every answer opens a new door to innovation.
            </p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="liquid-glass rounded-full px-8 py-3 text-sm font-medium text-white"
          >
            <span className="relative">Explore more</span>
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}
