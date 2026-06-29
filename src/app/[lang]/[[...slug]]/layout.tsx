import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { isSupportedLanguage } from "../../../lib/i18n";
import { source } from "../../../lib/source";

type DocsLayoutProps = {
  children: ReactNode;
  params: Promise<{
    lang: string;
  }>;
};

export default async function Layout({ children, params }: DocsLayoutProps) {
  const { lang } = await params;

  if (!isSupportedLanguage(lang)) {
    notFound();
  }

  return (
    <DocsLayout
      tree={source.getPageTree(lang)}
      i18n
      nav={{
        title: lang === "zh" ? "RouteLab 文档" : "RouteLab Docs",
        url: `/${lang}`
      }}
    >
      {children}
    </DocsLayout>
  );
}
