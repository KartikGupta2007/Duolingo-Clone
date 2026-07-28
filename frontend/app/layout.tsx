import type { Metadata } from "next";
import { Nunito } from "next/font/google";

import AppChrome from "@/components/shared/AppChrome";
import { ToastProvider } from "@/components/shared/ToastProvider";
import { UserProvider } from "@/components/shared/UserProvider";

import "./globals.css";

// Duolingo's own typeface is proprietary; Nunito is the closest free rounded
// sans (§8).
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

// The favicon needs no entry here: `app/icon.svg` is picked up by the App
// Router's file convention and linked automatically.
export const metadata: Metadata = {
  title: "Duolingo - Learn English with lessons that work",
  description:
    "A gamified language-learning app: skill path, lessons, XP, streaks, hearts and leaderboards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="font-sans">
        <ToastProvider>
          <UserProvider>
            <AppChrome>{children}</AppChrome>
          </UserProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
