import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CascadeOps — Policy Change Compiler",
  description: "One policy change. Every operation aligned.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
