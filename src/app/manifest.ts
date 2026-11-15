import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SpecialSauce.io | The World's First Secured Workforce Ecosystem",
    short_name: "SpecialSauce.io",
    description: "The world's first secured workforce ecosystem—securely connecting ID-verified Professionals and domain-verified Employers based on real skills and upfront pay.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    icons: [
      {
        src: "/favicon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
