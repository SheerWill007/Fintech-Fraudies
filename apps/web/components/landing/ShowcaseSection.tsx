export function ShowcaseSection() {
  return (
    <section className="border-t border-white/5">
      <div className="relative min-h-[480px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(to bottom, #1a1a1a 0%, transparent 30%), linear-gradient(135deg, #4a3728 0%, #2d241c 40%, #1a2e1a 100%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />

        <div className="relative mx-auto flex min-h-[480px] max-w-content flex-col justify-end px-6 py-16 lg:px-8">
          <div className="ml-auto max-w-md text-left">
            <button
              type="button"
              className="mb-6 w-full max-w-xs rounded-full bg-white/15 px-8 py-3 text-sm font-medium text-white backdrop-blur-sm"
            >
              Join now
            </button>
            <p className="text-sm leading-relaxed text-white/90">
              Ava Torres is a certified strength coach with 80k+ followers on
              Instagram. → 12-week progressive training programs with video
              lessons → Weekly live Q&As and form-check threads → A supportive
              community of women training for strength
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
