import type { Metadata } from "next";
import type { ReactNode } from "react";
import { UmamiScript } from "../components/umami-script";
import "./globals.css";

const docsSiteUrl = process.env.NEXT_PUBLIC_DOCS_SITE_URL ?? "https://docs.routemarket.ai";
const umamiWebsiteId =
  process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? "39d75733-9690-472f-8d83-97fe6317468f";
const umamiScriptUrl =
  process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ?? "https://analytics.routemarket.ai/rm.js";

export const metadata: Metadata = {
  metadataBase: new URL(docsSiteUrl),
  title: {
    default: "RouteMarket Docs",
    template: "%s | RouteMarket Docs"
  },
  description: "RouteMarket product documentation powered by Fumadocs.",
  applicationName: "RouteMarket Docs"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <UmamiScript scriptUrl={umamiScriptUrl} websiteId={umamiWebsiteId} />
        {children}
      </body>
    </html>
  );
}
