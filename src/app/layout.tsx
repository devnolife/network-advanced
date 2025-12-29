import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Network Security Virtual Lab",
  description: "Advanced Network Security and Protocols Interactive Learning Platform - Learn VPN, Firewall, IDS, and more through hands-on simulations",
  keywords: ["network security", "VPN", "IPSec", "firewall", "IDS", "cybersecurity", "learning", "simulation"],
  authors: [{ name: "Network Security Lab Team" }],
  openGraph: {
    title: "Network Security Virtual Lab",
    description: "Interactive platform for learning network security through hands-on simulations",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
