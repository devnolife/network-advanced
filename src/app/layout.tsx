import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "CyberNexus - Virtual Security Lab",
  description: "Advanced Cybersecurity Interactive Learning Platform - Master VPN, Firewall, IDS, and more through immersive hands-on simulations",
  keywords: ["cybersecurity", "network security", "VPN", "IPSec", "firewall", "IDS", "hacking", "learning", "simulation", "virtual lab"],
  authors: [{ name: "CyberNexus Team" }],
  openGraph: {
    title: "CyberNexus - Virtual Security Lab",
    description: "Immersive platform for mastering cybersecurity through hands-on virtual simulations",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
