import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Brief } from "@/components/landing/Brief";
import { Hero } from "@/components/landing/Hero";
import { LiveStrip } from "@/components/landing/LiveStrip";
import { Pipeline } from "@/components/landing/Pipeline";
import { Applications, CTA, Governance, Limits, Market, Problem } from "@/components/landing/Sections";

export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <Problem />
      <Pipeline />
      <LiveStrip />
      <Brief />
      <Applications />
      <Market />
      <Governance />
      <Limits />
      <CTA />
      <Footer />
    </main>
  );
}
