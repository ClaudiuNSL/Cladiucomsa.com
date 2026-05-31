import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Claudiu Comșa — Web Developer din Constanța",
    short_name: "Claudiu Comșa",
    description:
      "Web developer freelance din Constanța. Site-uri și experiențe digitale cinematice.",
    start_url: "/",
    display: "standalone",
    background_color: "#1c1a16",
    theme_color: "#f3eee4",
    icons: [{ src: "/logo-cc.jpg", sizes: "1024x1024", type: "image/jpeg" }],
    lang: "ro-RO",
  };
}
