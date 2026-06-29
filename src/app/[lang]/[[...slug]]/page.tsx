import { notFound } from "next/navigation";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { isSupportedLanguage } from "../../../lib/i18n";
import { source } from "../../../lib/source";

type DocsPageProps = {
  params: Promise<{
    lang: string;
    slug?: string[];
  }>;
};

export default async function Page({ params }: DocsPageProps) {
  const { lang, slug } = await params;

  if (!isSupportedLanguage(lang)) {
    notFound();
  }

  const page = source.getPage(slug, lang);

  if (!page) {
    notFound();
  }

  const MdxContent = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      {page.data.description ? <DocsDescription>{page.data.description}</DocsDescription> : null}
      <DocsBody>
        <MdxContent components={defaultMdxComponents} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams("slug", "lang");
}
