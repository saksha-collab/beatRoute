import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "BeatRoute — India Entertainment Radar",
  description:
    "Unified entertainment discovery & ticket checkout engine for India. Compare ticket prices, active phases, and booking fees across BookMyShow, District by Zomato, and multiplex counters in Pune, Mumbai, and pan-India.",
  keywords: [
    "concert tickets India",
    "live events Pune Mumbai",
    "BookMyShow vs District",
    "movie ticket convenience fee comparison",
    "District Zomato tickets",
    "credit card BOGO movie offers",
    "entertainment radar India",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-text-primary antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
