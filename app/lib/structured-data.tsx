// Schema.org Person JSON-LD pentru SEO și rich results.
// Server component inert — fără client context, fără hydration cost.

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Claudiu Comșa",
  url: "https://claudiucomsa.com",
  jobTitle: "Web Developer",
  email: "claudiucomsa29@gmail.com",
  telephone: "+40761880406",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Constanța",
    addressCountry: "RO",
  },
  knowsAbout: [
    "Web development",
    "Next.js",
    "React",
    "Three.js",
    "GSAP",
    "TypeScript",
    "UI/UX design",
    "Performance optimization",
  ],
  areaServed: { "@type": "Country", name: "România" },
  // sameAs: [] — TODO: user provides social handles
};

export function PersonJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
    />
  );
}
