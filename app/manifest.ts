import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Comsa Claudiu — Web Developer",
    short_name: "Comsa Claudiu",
    description:
      "Programator web freelancer în Constanța. Creare site-uri și aplicații web moderne.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#06B6D4",
    lang: "ro",
    icons: [
      {
        src: "/logo-cc.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
