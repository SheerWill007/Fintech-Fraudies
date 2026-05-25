const leaders = [
  { rank: 1, name: "Alex Chen", role: "Product · 42 posts", points: 4120, delta: 120 },
  { rank: 2, name: "Morgan Lee", role: "Design · 38 posts", points: 3890, delta: 85 },
  { rank: 3, name: "Sam Jordan", role: "Engineering · 31 posts", points: 2905, delta: 64, highlight: true },
  { rank: 4, name: "Riley Park", role: "Marketing · 28 posts", points: 2410, delta: 42 },
];

const rankColors = ["bg-amber-500/20 text-amber-400", "bg-zinc-400/20 text-zinc-300", "bg-orange-700/30 text-orange-300", "bg-zinc-700/30 text-zinc-400"];

export function LeaderboardSection() {
  return (
    <section className="border-t border-white/5 py-24 md:py-32">
      <div className="mx-auto max-w-content px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d]">
          <div className="grid lg:grid-cols-2">
            <div className="relative min-h-[360px] border-b border-white/5 p-6 lg:border-b-0 lg:border-r">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, #3d2c24 0%, #1a1410 50%, #0d0d0d 100%)",
                }}
              />
              <div className="relative glass-card rounded-xl p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-600" />
                    <div>
                      <p className="text-sm font-medium">Sam Jordan</p>
                      <p className="text-xs text-muted">Rank #3 · 2,905 points</p>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-muted">
                    Level 7
                  </span>
                </div>

                <div className="mb-4 flex gap-2">
                  {["7 days", "30 days", "All time"].map((period, i) => (
                    <button
                      key={period}
                      type="button"
                      className={`rounded-full px-3 py-1 text-xs ${
                        i === 1 ? "bg-white/10 text-white" : "text-muted"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-muted">
                    <span className="col-span-2">Rank</span>
                    <span className="col-span-7">Member</span>
                    <span className="col-span-3 text-right">Points</span>
                  </div>
                  {leaders.map((row) => (
                    <div
                      key={row.rank}
                      className={`grid grid-cols-12 items-center gap-2 rounded-lg px-2 py-2 text-sm ${
                        row.highlight ? "bg-white/5" : ""
                      }`}
                    >
                      <span
                        className={`col-span-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${rankColors[row.rank - 1]}`}
                      >
                        {row.rank}
                      </span>
                      <div className="col-span-7 flex items-center gap-2">
                        <div className="h-7 w-7 shrink-0 rounded-full bg-zinc-600" />
                        <div>
                          <p className="font-medium">{row.name}</p>
                          <p className="text-xs text-muted">{row.role}</p>
                        </div>
                      </div>
                      <div className="col-span-3 text-right">
                        <p className="font-medium">{row.points.toLocaleString()}</p>
                        <p className="text-xs text-emerald-500/80">+{row.delta} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center p-8 md:p-12">
              <span className="section-badge mb-6">Friendly competition</span>
              <h3 className="mb-4 text-2xl font-semibold md:text-3xl">
                A leaderboard your members actually check.
              </h3>
              <p className="mb-8 leading-relaxed text-muted">
                Rankings based on posts, completions, and activity — surfaced
                automatically. Gives your most engaged members a reason to stay
                and your quieter ones a reason to show up.
              </p>
              <p className="flex items-center gap-2 text-sm text-zinc-500">
                <span className="text-zinc-400">✦</span>
                Engagement that compounds over time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
