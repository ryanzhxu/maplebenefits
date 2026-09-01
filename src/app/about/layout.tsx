import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "MapleBenefits is a free, private, non-commercial tool that helps people in Canada discover government benefits they may be eligible for.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
