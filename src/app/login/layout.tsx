import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your SpecialSauce.io account to review job matches, invitations, and messages.",
  alternates: {
    canonical: "/login",
  },
  robots: { index: false, follow: true },
};

export default function RouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
