import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How It Works for Professionals & Employers",
  description: "See step-by-step how ID-verified professionals and verified employers match on real skills, review upfront pay, and connect privately on SpecialSauce.io.",
  alternates: {
    canonical: "/workflows",
  },
};

export default function RouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
