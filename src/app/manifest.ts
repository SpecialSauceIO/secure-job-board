import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SpecialSauce.io | Verified Job Marketplace",
    short_name: "SpecialSauce.io",
    description: "Verified job marketplace securely connecting ID-verified professionals and verified employers based on real skills and upfront pay.",
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
