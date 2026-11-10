import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started",
  description: "Join SpecialSauce.io as a verified professional or verified employer. Verify once and explore job matches for free.",
  alternates: {
    canonical: "/signup",
  },
};

export default function RouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
