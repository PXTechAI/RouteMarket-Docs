import { defineI18n } from "fumadocs-core/i18n";
import { defineI18nUI } from "fumadocs-ui/i18n";

export const i18n = defineI18n({
  languages: ["zh", "en"],
  defaultLanguage: "zh",
  hideLocale: "never",
  parser: "dot",
  fallbackLanguage: "en"
});

export const i18nUI = defineI18nUI(i18n, {
  translations: {
    zh: {
      displayName: "简体中文",
      search: "搜索",
      searchNoResult: "没有搜索结果",
      toc: "目录",
      tocNoHeadings: "本页暂无目录",
      lastUpdate: "最后更新",
      chooseLanguage: "选择语言",
      nextPage: "下一页",
      previousPage: "上一页",
      chooseTheme: "切换主题",
      editOnGithub: "在 GitHub 上编辑"
    },
    en: {
      displayName: "English",
      search: "Search",
      searchNoResult: "No results found",
      toc: "On This Page",
      tocNoHeadings: "No headings on this page",
      lastUpdate: "Last updated",
      chooseLanguage: "Choose language",
      nextPage: "Next page",
      previousPage: "Previous page",
      chooseTheme: "Choose theme",
      editOnGithub: "Edit on GitHub"
    }
  }
});

export type DocsLanguage = (typeof i18n.languages)[number];

export function isSupportedLanguage(value: string): value is DocsLanguage {
  return i18n.languages.includes(value as DocsLanguage);
}
