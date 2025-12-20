import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ISO Archive",
  description: "The Great Library of ISOs",
};

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Sidebar } from "../components/sidebar";
import { TRPCProvider } from "../trpc/provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className="dark" lang="en">
      <body className={`${inter.className} bg-background text-foreground`}>
        <NuqsAdapter>
          <TRPCProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 pl-64 transition-all duration-300">
                <div className="h-full">{children}</div>
              </main>
            </div>
          </TRPCProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
