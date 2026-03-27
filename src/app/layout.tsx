import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const mesloNF = localFont({
  src: [
    {
      path: "../../public/fonts/MesloLGS-NF-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/MesloLGS-NF-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-nerd",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Devin Bartley — AI & Innovation",
  description:
    "I think in architecture, I build with AI. Manager of AI & Innovation at Deloitte.",
  openGraph: {
    title: "Devin Bartley — AI & Innovation",
    description:
      "I think in architecture, I build with AI. Manager of AI & Innovation at Deloitte.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrainsMono.variable} ${inter.variable} ${mesloNF.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
