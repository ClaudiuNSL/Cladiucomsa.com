import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LenisProvider from "./components/LenisProvider";
import { ScrollPaletteProvider } from "./lib/scroll-palette-context";
import ShaderBackground from "./components/ShaderBackground";
import IcosahedronScene from "./components/IcosahedronScene";
import TransitionFlash from "./components/TransitionFlash";
import ScrollProgress from "./components/ScrollProgress";
import Cursor from "./components/Cursor";
// SoundToggle removed — Phase 2 când există fișier audio la public/audio/ambient.mp3
import Nav from "./components/Nav";
import { PersonJsonLd } from "./lib/structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://claudiucomsa.com"),
  title: {
    default: "Claudiu Comșa — Web Developer din Constanța",
    template: "%s · Claudiu Comșa",
  },
  description:
    "Construiesc site-uri și experiențe digitale cinematice. Web developer freelance din Constanța. Disponibil pentru proiecte noi.",
  openGraph: {
    type: "website",
    locale: "ro_RO",
    siteName: "Claudiu Comșa",
    url: "https://claudiucomsa.com",
    title: "Claudiu Comșa — Web Developer din Constanța",
    description:
      "Construiesc site-uri și experiențe digitale cinematice. Web developer freelance din Constanța. Disponibil pentru proiecte noi.",
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3eee4" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1a16" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <PersonJsonLd />
        <LenisProvider>
          <ScrollPaletteProvider>
            <ShaderBackground />
            <IcosahedronScene />
            <div className="glass" />
            <TransitionFlash />
            <ScrollProgress />
            <Cursor />
            <Nav />
            {children}
          </ScrollPaletteProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
