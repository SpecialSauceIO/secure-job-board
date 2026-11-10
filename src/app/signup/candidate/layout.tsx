import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Professional Sign Up",
  description: "Create your verified professional profile on SpecialSauce.io. Complete a one-time ID check, explore job matches for free, and keep your personal details private until you choose to unlock them.",
  alternates: {
    canonical: "/signup/candidate",
  },
};

export default function RouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
