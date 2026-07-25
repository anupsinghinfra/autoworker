import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-sans", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pokio — Hire AI employees that work 24/7",
  description: "Engineers, support agents, researchers. They watch your repos, fix bugs, answer tickets, write reports. You just approve. $0 when idle.",
  keywords: ["AI employee", "AI engineer", "autonomous agent", "hire AI", "24/7 AI worker", "pokio", "AI support agent"],
  metadataBase: new URL("https://pokio.ai"),
  openGraph: {
    title: "Pokio — Hire AI employees that work 24/7",
    description: "Engineers, support agents, researchers. They work while you sleep. You just approve.",
    url: "https://pokio.ai",
    siteName: "Pokio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pokio — Hire AI employees that work 24/7",
    description: "Hire AI engineers that watch your repos, fix bugs, open PRs. $0 when idle.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
