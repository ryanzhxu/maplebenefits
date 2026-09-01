import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse benefits",
  description:
    "Explore federal and British Columbia government benefits by category. See who qualifies, estimated value, and how to apply.",
};

export default function BenefitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
