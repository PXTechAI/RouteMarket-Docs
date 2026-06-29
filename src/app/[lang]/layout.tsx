import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { RootProvider } from "fumadocs-ui/provider";
import { i18nUI, isSupportedLanguage } from "../../lib/i18n";

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

  return <RootProvider i18n={i18nUI.provider(lang)}>{children}</RootProvider>;
}
