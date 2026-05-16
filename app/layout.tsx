import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AccessibilityWidget from "./components/AccessibilityWidget";
import LoadingScreen from "./components/LoadingScreen";
import CursorGlow from "./components/CursorGlow";
import BackToTop from "./components/BackToTop";
import PageTransition from "./components/PageTransition";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  verification: {
    google: "NCEWDwd-7Vx7Yti0PoIW3v4Y0xJcdN4e52PlDvW3Ipw",
  },
  title: {
    template: "%s | Comsa Claudiu — Web Developer",
    default: "Comsa Claudiu — Web Developer & Freelancer",
  },
  description:
    "Programator web freelancer în Constanța. Creare site-uri și aplicații web moderne cu React, Next.js și integrări AI. Soluții pentru afaceri locale.",
  openGraph: {
    title: "Comsa Claudiu — Web Developer & Freelancer",
    description:
      "Programator web freelancer din Constanța, Romania. Specializat în creare site-uri și aplicații web moderne.",
    url: "https://www.claudiucomsa.com",
    siteName: "Comsa Claudiu",
    locale: "ro_RO",
    type: "website",
    images: [
      {
        url: "/logo-cc.png",
        width: 1024,
        height: 1024,
        alt: "Comsa Claudiu — CC Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/logo-cc.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.claudiucomsa.com",
  },
  icons: {
    icon: "/icon",
    apple: "/logo-cc.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#06B6D4" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://www.claudiucomsa.com/#person",
      name: "Comsa Claudiu",
      jobTitle: "Web Developer",
      url: "https://www.claudiucomsa.com",
      email: "claudiucomsa29@gmail.com",
      telephone: "+40761880406",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Constanța",
        addressCountry: "Romania",
      },
      sameAs: [
        "https://github.com/ClaudiuNSL",
        "https://www.linkedin.com/in/claudiu-comsa-72b552364/",
      ],
    },
    {
      "@type": "LocalBusiness",
      "@id": "https://www.claudiucomsa.com/#business",
      name: "Comsa Claudiu",
      description:
        "Web Developer & Freelancer specializat în creare site-uri și aplicații web moderne.",
      url: "https://www.claudiucomsa.com",
      email: "claudiucomsa29@gmail.com",
      telephone: "+40761880406",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Constanța",
        addressCountry: "Romania",
      },
      sameAs: [
        "https://github.com/ClaudiuNSL",
        "https://www.linkedin.com/in/claudiu-comsa-72b552364/",
      ],
    },
    {
      "@type": "Service",
      name: "Web Development",
      serviceType: "Web Development",
      description:
        "Site-uri și aplicații web moderne, responsive și optimizate (SEO, performanță). Construite cu React și Next.js.",
      provider: { "@id": "https://www.claudiucomsa.com/#person" },
      areaServed: { "@type": "Country", name: "Romania" },
    },
    {
      "@type": "Service",
      name: "AI Integration",
      serviceType: "AI Integration",
      description:
        "Integrare AI în aplicații existente: chatbots, generare de conținut, agenți de email, automatizări inteligente.",
      provider: { "@id": "https://www.claudiucomsa.com/#person" },
      areaServed: { "@type": "Country", name: "Romania" },
    },
    {
      "@type": "Service",
      name: "Custom Solutions",
      serviceType: "Custom Web Solutions",
      description:
        "Soluții web custom: dashboard-uri, sisteme de management, platforme interne și tool-uri pentru workflow-uri specifice.",
      provider: { "@id": "https://www.claudiucomsa.com/#person" },
      areaServed: { "@type": "Country", name: "Romania" },
    },
    {
      "@type": "Service",
      name: "UI/UX Design",
      serviceType: "UI/UX Design",
      description:
        "Design de interfețe intuitive cu focus pe experiența utilizatorului, accesibilitate și consistență vizuală.",
      provider: { "@id": "https://www.claudiucomsa.com/#person" },
      areaServed: { "@type": "Country", name: "Romania" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LoadingScreen />
        <CursorGlow />
        <PageTransition>
          {children}
        </PageTransition>
        <BackToTop />
        <AccessibilityWidget />
      </body>
    </html>
  );
}
