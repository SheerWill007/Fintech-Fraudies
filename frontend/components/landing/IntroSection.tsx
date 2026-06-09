export function IntroSection() {
  return (
    <section id="about" className="scroll-mt-24 border-t border-white/5 py-24 md:py-32">
      <div className="mx-auto max-w-content px-6 lg:px-8">
        <span className="section-badge mb-10">Intro</span>

        <div className="max-w-4xl space-y-8">
          <p className="text-2xl font-medium leading-snug text-white md:text-3xl lg:text-4xl lg:leading-tight">
            Fora is a community platform built for creators, educators, and
            coaches. Courses, events, discussions, and a member directory, all in
            one place, under one login, with one URL.
          </p>

          <p className="text-lg leading-relaxed text-muted md:text-xl">
            That URL is yours. Every community on Fora runs on its own subdomain
            or a custom domain you own. Members sign up and sign in inside your
            branded space. They never see Fora&apos;s name, and they never should.
          </p>

          <p className="text-lg leading-relaxed text-muted md:text-xl">
            You set it up in minutes. Fora handles the routing, the auth, and the
            infrastructure in the background. What your members experience is
            entirely yours.
          </p>
        </div>
      </div>
    </section>
  );
}
