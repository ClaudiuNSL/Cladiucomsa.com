import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import BackToTop from "@/app/components/BackToTop";
import AccessibilityWidget from "@/app/components/AccessibilityWidget";
import PageTransition from "@/app/components/PageTransition";
import { getJsonLd } from "./_lib/jsonLd";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // TODO(task-2): messages don't exist yet. For now, use hardcoded fallbacks
  // so this file type-checks. Task 2 swaps these to getTranslations.
  return {
    title: {
      template: `%s | Comsa Claudiu`,
      default:
        locale === "ro"
          ? "Comsa Claudiu — Site-uri și automatizări AI"
          : "Comsa Claudiu — Websites & AI Automations",
    },
    description:
      locale === "ro"
        ? "Construim site-uri și automatizări AI pentru afaceri. Constanța · România · Remote."
        : "We build websites and AI automations for businesses. Constanța · Romania · Remote.",
    openGraph: {
      url: `https://www.claudiucomsa.com/${locale}`,
      siteName: "Comsa Claudiu",
      locale: locale === "ro" ? "ro_RO" : "en_US",
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
    twitter: { card: "summary_large_image" as const, images: ["/logo-cc.png"] },
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://www.claudiucomsa.com/${locale}`,
      languages: {
        ro: "https://www.claudiucomsa.com/ro",
        en: "https://www.claudiucomsa.com/en",
        "x-default": "https://www.claudiucomsa.com/ro",
      },
    },
    icons: { icon: "/icon", apple: "/logo-cc.png" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) notFound();
  const typedLocale = locale as Locale;
  setRequestLocale(typedLocale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages} locale={typedLocale}>
      <div lang={typedLocale}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getJsonLd(typedLocale)) }}
        />
        <PageTransition>{children}</PageTransition>
        <BackToTop />
        <AccessibilityWidget />
      </div>
    </NextIntlClientProvider>
  );
}
