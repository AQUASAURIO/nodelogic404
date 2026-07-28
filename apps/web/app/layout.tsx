import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nodelogic404 - Digital Twins for Trusted Collaboration",
    template: "%s | Nodelogic404",
  },
  description:
    "Stop guessing. Start simulating. Digital twins & simulation for trusted collaboration in work & productivity.",
  keywords: [
    "digital twins",
    "simulation",
    "collaboration",
    "productivity",
    "work",
    "trust",
    "decision making",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Nodelogic404",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
