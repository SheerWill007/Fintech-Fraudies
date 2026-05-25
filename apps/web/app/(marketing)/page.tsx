import { HeroSection } from "@/components/landing/HeroSection";
import { IntroSection } from "@/components/landing/IntroSection";
import { WhatYouGetSection } from "@/components/landing/WhatYouGetSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { LeaderboardSection } from "@/components/landing/LeaderboardSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { ShowcaseSection } from "@/components/landing/ShowcaseSection";
import { Footer } from "@/components/landing/Footer";
import { ChatWidget } from "@/components/ChatWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <HeroSection />
      <IntroSection />
      <WhatYouGetSection />
      <FeaturesSection />
      <LeaderboardSection />
      <PricingSection />
      <ShowcaseSection />
      <Footer />
      <ChatWidget />
    </main>
  );
}
