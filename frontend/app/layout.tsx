"use client";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/Header";
import { Providers } from "./providers";
import { usePathname } from "next/navigation";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showHeader = pathname !== "/";

  return (
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <Providers>
        {showHeader && <Header />}
        {children}
      </Providers>
    </body>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <LayoutContent>{children}</LayoutContent>
    </html>
  );
}
