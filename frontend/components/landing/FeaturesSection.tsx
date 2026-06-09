"use client";

import { useState } from "react";
import { DashboardMockup } from "./DashboardMockup";

const tabs = ["Community", "Courses", "Events", "Members"] as const;

export function FeaturesSection() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Courses");

  return (
    <section id="features" className="scroll-mt-24 border-t border-white/5 py-24 md:py-32">
      <div className="mx-auto max-w-content px-6 lg:px-8">
        <div className="mb-12 grid gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <span className="section-badge mb-6">Core Features</span>
            <h2 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              One platform to run your entire community.
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted lg:pt-10">
            Fora brings your courses, events, discussions, and members into one
            space, so you stop switching between tools and start spending time
            with your community.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-5 py-2 text-sm transition-colors ${
                activeTab === tab
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] p-4 md:p-6">
          <div className="mb-4 flex items-center justify-between px-2">
            <span className="text-sm font-medium text-zinc-400">{activeTab}</span>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-sky-500 px-3 py-1 text-xs font-medium text-white">
                Invite
              </span>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500" />
            </div>
          </div>
          <DashboardMockup variant="compact" communityName="DesignLab" memberCount="305 members" />
        </div>
      </div>
    </section>
  );
}
