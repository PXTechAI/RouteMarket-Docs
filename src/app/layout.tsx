import type { Metadata } from "next";
import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";

const docsSiteUrl = process.env.NEXT_PUBLIC_DOCS_SITE_URL ?? "https://docs.routemarket.ai";
const umamiWebsiteId =
  process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? "39d75733-9690-472f-8d83-97fe6317468f";
const umamiScriptUrl = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? "https://analytics.routemarket.ai/rm.js";
const analyticsHostnames = new Set(["docs.routemarket.ai"]);
const docsHostname = new URL(docsSiteUrl).hostname;
const shouldLoadUmami = analyticsHostnames.has(docsHostname);

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
        {shouldLoadUmami ? (
          <Script
            async
            data-website-id={umamiWebsiteId}
            src={umamiScriptUrl}
            strategy="afterInteractive"
          />
        ) : null}
        {children}
      </body>
    </html>
  );
}
