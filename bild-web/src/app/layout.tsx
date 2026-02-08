import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FilePreviewProvider } from "@/components/file-preview";
import { AuthProvider } from "@/components/auth-provider";
import { AuthLayout } from "@/components/auth-layout";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bild — Supervisor Dashboard",
  description:
    "Proof-of-work for construction. Real-time project status and proof viewer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <FilePreviewProvider>
          <AuthProvider>
            <AuthLayout>{children}</AuthLayout>
          </AuthProvider>
        </FilePreviewProvider>
      </body>
    </html>
  );
}
