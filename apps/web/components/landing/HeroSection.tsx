import { DashboardMockup } from "./DashboardMockup";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-28 pb-0">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-[#1a1520] to-black" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#1a2e1a] via-[#2a1f18] to-transparent opacity-80" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-[radial-gradient(ellipse_at_center,_#2d4a2d_0%,_transparent_70%)] opacity-40" />
      </div>

      <div className="relative z-10 mx-auto max-w-content px-6 text-center lg:px-8">
        <span className="section-badge mb-8">Community platform for creators</span>

        <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
          Your community deserves its own home.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
          Fora gives creators, educators, and coaches a fully branded space with
          courses, events, discussions, and members.
        </p>

        <div className="mt-10">
          <a href="#pricing" className="btn-primary inline-block px-8 py-3.5 text-base">
            Get started free
          </a>
        </div>

        <div className="relative mx-auto mt-16 max-w-4xl md:mt-20">
          <div className="absolute -inset-x-4 bottom-0 top-1/4 rounded-t-3xl bg-gradient-to-t from-black via-black/80 to-transparent" />
          <div className="relative translate-y-8 md:translate-y-12">
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
