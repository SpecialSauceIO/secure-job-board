import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employer Sign Up",
  description: "Create your verified employer account on SpecialSauce.io to connect directly with ID-verified professionals matched on real skills.",
  alternates: {
    canonical: "/signup/employer",
  },
};

export default function RouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
