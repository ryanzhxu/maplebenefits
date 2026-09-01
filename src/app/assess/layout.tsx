import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find what you qualify for",
  description:
    "Answer a few private questions and see which federal and BC benefits you may qualify for, with estimated value and how to apply.",
};

export default function AssessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
