import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fraunces serif italic — folosit doar pe cuvantul-accent din Hero ("Transform", "turn").
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.claudiucomsa.com"),
  verification: { google: "NCEWDwd-7Vx7Yti0PoIW3v4Y0xJcdN4e52PlDvW3Ipw" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#07090f" },
    { media: "(prefers-color-scheme: dark)", color: "#07090f" },
  ],
};

// Default ro: lang dinamic ar face root-layout async și ar pierde SSG pentru
// /ro și /en. Semnalizarea limbii se face prin <div lang> din [locale]/layout.tsx
// + hreflang alternate links din metadata — suficient pentru SEO/a11y.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <head>
        {/* Satoshi via Fontshare — wordmark in footer. */}
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@500,700&display=swap"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
