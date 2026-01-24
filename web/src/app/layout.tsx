import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haggle - AI Negotiation Trainer",
  description: "Practice salary negotiation with an AI that reads your stress and uses it against you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
