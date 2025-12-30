import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "CyberNexus - Laboratorium Keamanan Virtual",
  description: "Platform Pembelajaran Interaktif Keamanan Siber Tingkat Lanjut - Kuasai VPN, Firewall, IDS, dan lainnya melalui simulasi langsung yang imersif",
  keywords: ["keamanan siber", "keamanan jaringan", "VPN", "IPSec", "firewall", "IDS", "hacking", "pembelajaran", "simulasi", "laboratorium virtual"],
  authors: [{ name: "Tim CyberNexus" }],
  openGraph: {
    title: "CyberNexus - Laboratorium Keamanan Virtual",
    description: "Platform imersif untuk menguasai keamanan siber melalui simulasi virtual langsung",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
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
