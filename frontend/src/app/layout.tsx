import type { Metadata } from "next";
import { Inter, EB_Garamond, Geist } from "next/font/google";
import LayoutWrapper from "@/components/LayoutWrapper";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});
const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://synapse-knowledge.vercel.app"),
  title: "Synapse — A memory that knows when to update itself",
  description: "A self-organizing personal knowledge graph that ingests everything you read, write, and build — and actively maintains itself.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png?v=3", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png?v=3", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico?v=3", sizes: "any" },
    ],
    shortcut: "/favicon.ico?v=3",
    apple: "/apple-touch-icon.png?v=3",
  },
  openGraph: {
    title: "Synapse — A memory that knows when to update itself",
    description: "A self-organizing personal knowledge graph built on Cognee's memory lifecycle.",
    url: "https://synapse-knowledge.vercel.app",
    siteName: "Synapse",
    images: [
      {
        url: "https://ik.imagekit.io/9pfz6g8ri/Synapse_assets/og-image.png",
        width: 1200,
        height: 630,
        alt: "Synapse Metadata Graph and memory visualization",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Synapse — A memory that knows when to update itself",
    description: "A self-organizing personal knowledge graph built on Cognee's memory lifecycle.",
    images: ["https://ik.imagekit.io/9pfz6g8ri/Synapse_assets/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${garamond.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full bg-canvas text-ink">
        <script dangerouslySetInnerHTML={{
          __html: `requestAnimationFrame(()=>document.documentElement.classList.add("theme-transition"))`
        }} />
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
