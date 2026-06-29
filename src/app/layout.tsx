import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider";
import "./globals.css";

const docsSiteUrl = process.env.NEXT_PUBLIC_DOCS_SITE_URL ?? "https://docs.routemarket.ai";

export const metadata: Metadata = {
  metadataBase: new URL(docsSiteUrl),
  title: {
    default: "RouteLab Docs",
    template: "%s | RouteLab Docs"
  },
  description: "RouteLab product documentation powered by Fumadocs.",
  applicationName: "RouteLab Docs"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
