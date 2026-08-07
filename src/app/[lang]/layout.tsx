import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { RootProvider } from "fumadocs-ui/provider";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { i18nUI, isSupportedLanguage } from "../../lib/i18n";
import { source } from "../../lib/source";

type LangLayoutProps = {
  children: ReactNode;
  params: Promise<{
    lang: string;
  }>;
};

export default async function LangLayout({ children, params }: LangLayoutProps) {
  const { lang } = await params;

  if (!isSupportedLanguage(lang)) {
    notFound();
  }

  return (
    <RootProvider i18n={i18nUI.provider(lang)}>
      <DocsLayout
        tree={source.getPageTree(lang)}
        i18n
        nav={{
          title: lang === "zh" ? "RouteMarket 文档" : "RouteMarket Docs",
          url: `/${lang}`
        }}
      >
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
