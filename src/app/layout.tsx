import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MonForm — Onchain Encrypted Allowlist Forms",
  description:
    "Every submission is recorded onchain on Monad. Every applicant's data stays sealed until the owner's wallet opens it.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "MonForm — Onchain Encrypted Allowlist Forms",
    description:
      "Every submission is recorded onchain on Monad. Every applicant's data stays sealed until the owner's wallet opens it.",
    images: [{ url: "/logo.png", width: 256, height: 256 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <Providers>
          <header className="hairline border-x-0 border-t-0 sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
            <div className="container flex h-16 items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2.5 font-display text-lg font-medium tracking-tight"
              >
                <Image
                  src="/logo.png"
                  alt="MonForm"
                  width={28}
                  height={28}
                  className="rounded-lg shrink-0"
                  priority
                />
                MonForm
              </Link>
              <WalletConnectButton />
            </div>
          </header>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
