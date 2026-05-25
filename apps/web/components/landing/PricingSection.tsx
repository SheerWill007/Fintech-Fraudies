import { Check } from "lucide-react";

const features = [
  "Custom subdomain",
  "Custom domain",
  "Community feed",
  "Courses",
  "Events and calendar",
  "Member directory and leaderboard",
];

export function PricingSection() {
  return (
    <section id="pricing" className="scroll-mt-24 border-t border-white/5 py-24 md:py-32">
      <div className="mx-auto max-w-content px-6 lg:px-8">
        <p className="mb-12 text-center text-5xl font-semibold tracking-tight text-white/10 md:text-7xl">
          Join the beta today.
        </p>

        <div className="mx-auto max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#111111]">
          <div className="p-8 md:p-10">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">
              Beta
            </span>

            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <h2 className="text-4xl font-semibold">Free</h2>
              <span className="text-muted">No credit card required</span>
            </div>

            <div className="mt-6 space-y-4 text-muted">
              <p className="leading-relaxed">
                Fora is in beta and completely free right now. Everyone who joins
                during beta gets a permanent discount when paid plans launch —
                locked in, forever.
              </p>
              <p className="leading-relaxed">
                Paid plans are coming. Beta members get first access and a lifetime
                discount.
              </p>
            </div>

            <button type="button" className="mt-8 w-full rounded-xl bg-zinc-800 py-3.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700">
              Join the beta
            </button>

            <ul className="mt-8 divide-y divide-white/10">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 py-4 text-sm text-zinc-300"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/20">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
