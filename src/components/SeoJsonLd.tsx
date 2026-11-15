import React from "react";

const seoSchemaGraph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.specialsauce.io/#organization",
      name: "SpecialSauce.io",
      legalName: "Special Sauce Solutions LLC",
      alternateName: [
        "Special Sauce",
        "Special Sauce Workforce Ecosystem",
        "Secured Workforce Ecosystem",
      ],
      url: "https://www.specialsauce.io",
      logo: {
        "@type": "ImageObject",
        "@id": "https://www.specialsauce.io/#logo",
        url: "https://www.specialsauce.io/logo.png",
        contentUrl: "https://www.specialsauce.io/logo.png",
        caption: "SpecialSauce.io",
      },
      image: { "@id": "https://www.specialsauce.io/#logo" },
      email: "info@specialsauce.io",
      description:
        "The world's first secured workforce ecosystem—securely connecting ID-verified Professionals and domain-verified Employers based on real skills, upfront pay, and mutual interest.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "5900 Balcones Dr #34619",
        addressLocality: "Austin",
        addressRegion: "TX",
        postalCode: "78731",
        addressCountry: "US",
      },
      sameAs: [
        "https://www.linkedin.com/company/specialsauceio/",
        "https://www.instagram.com/specialsauce.io/",
        "https://www.facebook.com/profile.php?id=61595271106490",
        "https://x.com/specialsauceio",
        "https://www.youtube.com/channel/UCIAZM_kRqw0t1aPn1UFvneQ",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.specialsauce.io/#website",
      url: "https://www.specialsauce.io",
      name: "SpecialSauce.io",
      alternateName: ["Special Sauce", "The World's First Secured Workforce Ecosystem"],
      description:
        "Securely connecting ID-verified professionals and verified employers based on real skills and upfront pay.",
      publisher: {
        "@id": "https://www.specialsauce.io/#organization",
      },
    },
    {
      "@type": "WebApplication",
      "@id": "https://www.specialsauce.io/#webapp",
      name: "SpecialSauce.io",
      url: "https://www.specialsauce.io",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      provider: {
        "@id": "https://www.specialsauce.io/#organization",
      },
      description:
        "The world's first secured workforce ecosystem where ID-verified Professionals and domain-verified Employers connect on real skills and upfront pay while keeping personal details private until unlocked.",
    },
  ],
};

export default function SeoJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(seoSchemaGraph) }}
    />
  );
}
