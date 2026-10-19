import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Brief } from "@/components/landing/Brief";
import { Hero } from "@/components/landing/Hero";
import { LiveStrip } from "@/components/landing/LiveStrip";
import { Marquee } from "@/components/landing/Marquee";
import { Model } from "@/components/landing/Model";
import { Pipeline } from "@/components/landing/Pipeline";
import { Applications, CTA, Governance, Limits, Market, Problem } from "@/components/landing/Sections";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Marquee />
      <Problem />
      <Pipeline />
      <LiveStrip />
      <Model />
      <Applications />
      <Market />
      <Brief />
      <Governance />
      <Limits />
      <CTA />
      <Footer />
    </main>
  );
}
