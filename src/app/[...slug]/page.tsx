import type { Metadata } from "next";
import { LanguageRedirect } from "../../components/language-redirect";
import { source } from "../../lib/source";

type SlugAliasPageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function SlugAliasPage({ params }: SlugAliasPageProps) {
  const { slug } = await params;

  return <LanguageRedirect slug={slug} />;
}

export async function generateStaticParams() {
  const localizedParams = source.generateParams("slug", "lang") as Array<{
    lang: string;
    slug?: string[];
  }>;

  const unique = new Map<string, string[]>();

  for (const { slug } of localizedParams) {
    if (!slug || slug.length === 0) {
      continue;
    }

    const key = slug.join("/");

    if (!unique.has(key)) {
      unique.set(key, slug);
    }
  }

  return Array.from(unique.values(), (slug) => ({ slug }));
}
