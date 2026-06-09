type DashboardMockupProps = {
  variant?: "hero" | "compact";
  communityName?: string;
  memberCount?: string;
};

const sidebarItems = [
  "Overview",
  "Chat",
  "Courses",
  "Events",
  "Members",
  "Leaderboard",
];

export function DashboardMockup({
  variant = "hero",
  communityName = "Frame & Light",
  memberCount = "987 members",
}: DashboardMockupProps) {
  const isHero = variant === "hero";

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl ${
        isHero ? "mx-auto w-full max-w-4xl" : "w-full"
      }`}
    >
      <div className={`flex ${isHero ? "min-h-[280px] md:min-h-[340px]" : "min-h-[220px]"}`}>
        <aside className="hidden w-44 shrink-0 border-r border-white/5 bg-[#0a0a0a] p-4 sm:block md:w-52">
          <div className="mb-4 h-2 w-16 rounded-full bg-white/10" />
          <div className="mb-6 h-8 w-8 rounded-lg bg-white/5" />
          <ul className="space-y-2.5">
            {sidebarItems.map((item, i) => (
              <li
                key={item}
                className={`flex items-center gap-2 text-xs ${
                  i === 0 ? "text-white" : "text-zinc-500"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                {item}
              </li>
            ))}
          </ul>
        </aside>

        <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-200/90 via-white to-fuchsia-600/80 p-8">
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-semibold text-black">
              {communityName.charAt(0)}
            </div>
            <h3 className="text-xl font-semibold text-white drop-shadow-sm md:text-2xl">
              {communityName}
            </h3>
            <p className="mt-1 text-sm text-white/80">{memberCount}</p>
            <button
              type="button"
              className="mt-5 rounded-full bg-white/25 px-8 py-2.5 text-sm font-medium text-white backdrop-blur-sm"
            >
              Join now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
