import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-eval' + blob: pentru WebGL/Three.js. blob: pentru DRACOLoader Web Worker.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
      // worker-src explicit ca DRACOLoader sa poata crea Web Worker din blob.
      "worker-src 'self' blob:",
      // Fontshare pentru fontul Satoshi din footer.
      "style-src 'self' 'unsafe-inline' https://api.fontshare.com",
      "font-src 'self' data: https://api.fontshare.com https://cdn.fontshare.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://formspree.io https://vercel.live https://vitals.vercel-insights.com",
      "form-action 'self' https://formspree.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
