import type { Metadata } from "next";
import { Cormorant_Garamond, Outfit } from "next/font/google";
import "./globals.css";
import { getAppData } from "@/lib/store";
import { absoluteUrl } from "@/lib/utils";

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const data = await getAppData();
    const { settings } = data;
    return {
      title: settings.seoTitle,
      description: settings.seoDescription,
      openGraph: {
        title: settings.seoTitle,
        description: settings.seoDescription,
        images: [{ url: absoluteUrl(settings.ogImage || settings.heroImage) }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: settings.seoTitle,
        description: settings.seoDescription,
        images: [absoluteUrl(settings.ogImage || settings.heroImage)],
      },
    };
  } catch {
    return {
      title: "Wedding Invitation",
      description: "A premium wedding invitation experience",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${serif.variable} ${sans.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
