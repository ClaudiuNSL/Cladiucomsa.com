import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import AtmosphericGlow from "@/app/components/AtmosphericGlow";
import BackToTop from "@/app/components/BackToTop";
import LenisProvider from "@/app/components/LenisProvider";
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
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: {
      template: t("titleTemplate"),
      default: t("defaultTitle"),
    },
    description: t("description"),
    openGraph: {
      url: `https://www.claudiucomsa.com/${locale}`,
      siteName: t("siteName"),
      locale: locale === "ro" ? "ro_RO" : "en_US",
      type: "website",
      images: [
        {
          url: "/logo-cc.jpg",
          width: 1024,
          height: 1024,
          alt: t("ogImageAlt"),
        },
      ],
    },
    twitter: { card: "summary_large_image" as const, images: ["/logo-cc.jpg"] },
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://www.claudiucomsa.com/${locale}`,
      languages: {
        ro: "https://www.claudiucomsa.com/ro",
        en: "https://www.claudiucomsa.com/en",
        "x-default": "https://www.claudiucomsa.com/ro",
      },
    },
    icons: { icon: "/icon", apple: "/logo-cc.jpg" },
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
  const jsonLd = await getJsonLd(typedLocale);

  return (
    <NextIntlClientProvider messages={messages} locale={typedLocale}>
      <div lang={typedLocale}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LenisProvider>
          <AtmosphericGlow />
          <PageTransition>{children}</PageTransition>
          <BackToTop />
        </LenisProvider>
      </div>
    </NextIntlClientProvider>
  );
}
