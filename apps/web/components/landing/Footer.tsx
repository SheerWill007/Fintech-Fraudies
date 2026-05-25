import Link from "next/link";

const footerLinks = ["Product", "About", "Features", "What you get", "Pricing"];

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black py-16">
      <div className="mx-auto max-w-content px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-12 md:flex-row md:items-start">
          <Link href="/" className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-semibold text-black">
            f
          </Link>

          <nav className="flex flex-col gap-3 text-right md:items-end">
            {footerLinks.map((label) => (
              <a
                key={label}
                href={
                  label === "About"
                    ? "#about"
                    : label === "Features"
                      ? "#features"
                      : label === "What you get"
                        ? "#what-you-get"
                        : label === "Pricing"
                          ? "#pricing"
                          : "#"
                }
                className="text-sm text-zinc-400 transition-colors hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>

        <p className="mt-16 text-sm text-muted">
          © Fora. 2026. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
