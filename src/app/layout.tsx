import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Outfit } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SplitCart · Free shipping, together",
  description:
    "Pool your order with UMass students shopping the same store. Hit the free-shipping minimum, split the rest.",
};

export const viewport: Viewport = {
  themeColor: "#101114",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full bg-ink">
        <Suspense>
          <SiteHeader />
          {children}
        </Suspense>
      </body>
    </html>
  );
}
