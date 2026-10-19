import type { Metadata, Viewport } from "next";
import { Figtree, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", weight: ["400", "500", "600"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Metrics",
  description:
    "The verified work-injury event record for Hong Kong's delivery workers. The phone they already carry, a 3D-printed helmet clip, a crash model with error bars, a signed record, a payout in a day.",
  metadataBase: new URL("https://metricsfile.vercel.app"),
  openGraph: {
    title: "Metrics",
    description: "Proof for the people who keep this city moving.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${mono.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
