export function WhatYouGetSection() {
  return (
    <section id="what-you-get" className="scroll-mt-24 border-t border-white/5 py-24 md:py-32">
      <div className="mx-auto max-w-content px-6 lg:px-8">
        <div className="mb-16 grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <span className="section-badge mb-6">What you get</span>
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              Set up once.
              <br />
              <span className="text-zinc-500">Run it the way you want.</span>
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted">
            Fora is built so you spend time with your community, not configuring
            it. From your first setting to your hundredth member, the platform
            stays out of your way.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d]">
          <div className="grid lg:grid-cols-2">
            <div className="border-b border-white/5 p-8 md:p-12 lg:border-b-0 lg:border-r">
              <span className="section-badge mb-6">Your front door</span>
              <h3 className="mb-4 text-2xl font-semibold md:text-3xl">
                A community overview page that sells itself.
              </h3>
              <p className="leading-relaxed text-muted">
                Customize your hero with a static color or animated gradient. Add a
                headline, a description and member avatars. Your overview page is
                the first thing a visitor sees — make it yours.
              </p>
            </div>

            <div className="relative min-h-[280px] bg-gradient-to-br from-zinc-800/80 to-zinc-950 p-8">
              <div className="mx-auto max-w-xs rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-sm">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-orange-400 via-rose-500 to-violet-600" />
                <h4 className="text-center text-lg font-semibold">DesignLab</h4>
                <p className="mt-1 text-center text-xs text-muted">designlab.com</p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-6 w-6 rounded-full border-2 border-black bg-zinc-600"
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted">305 members</span>
                </div>
                <button
                  type="button"
                  className="mt-5 w-full rounded-lg bg-zinc-700 py-2.5 text-sm font-medium text-white"
                >
                  Join now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
