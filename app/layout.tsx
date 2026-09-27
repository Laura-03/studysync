import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudySync",
  description:
    "StudySync matches you with a study partner for focused, accountable study sessions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}