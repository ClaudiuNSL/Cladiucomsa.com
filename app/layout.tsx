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
import SoundToggle from "./components/SoundToggle";
import Nav from "./components/Nav";

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
  metadataBase: new URL("https://www.claudiucomsa.com"),
  title: "Claudiu Comșa — Web Developer din Constanța",
  description:
    "Construiesc site-uri și experiențe digitale cinematice. Web developer freelance din Constanța. Disponibil pentru proiecte noi.",
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
        <ShaderBackground />
        <IcosahedronScene />
        <div className="glass" />
        <TransitionFlash />
        <ScrollProgress />
        <Cursor />
        <SoundToggle />
        <Nav />
        <LenisProvider>
          <ScrollPaletteProvider>{children}</ScrollPaletteProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
