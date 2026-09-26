import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "BeatRoute — Concert Travel Arbitrage Engine",
  description:
    "Production-grade concert travel arbitrage engine. Compare round-trip flights, Indian Railways, hotels, and ticket tiers across Indian cities to find net travel savings.",
  keywords: [
    "concert travel",
    "ticket arbitrage",
    "Coldplay India",
    "Diljit Dosanjh tour",
    "Karan Aujla tickets",
    "Indian Railways concert trip",
    "flight arbitrage",
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
