"use client";

import { useEffect } from "react";

type LanguageRedirectProps = {
  slug?: string[];
};

function resolvePreferredLanguage() {
  const browserLanguages =
    typeof navigator !== "undefined" && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];

  for (const language of browserLanguages) {
    if (language.toLowerCase().startsWith("zh")) {
      return "zh";
    }
  }

  return "en";
}

export function LanguageRedirect({ slug = [] }: LanguageRedirectProps) {
  useEffect(() => {
    const preferredLanguage = resolvePreferredLanguage();
    const normalizedSlug = slug.length > 0 ? `/${slug.join("/")}` : "";
    window.location.replace(`/${preferredLanguage}${normalizedSlug}`);
  }, [slug]);

  const slugPath = slug.length > 0 ? `/${slug.join("/")}` : "";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        textAlign: "center"
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: "14px", opacity: 0.72 }}>
          Redirecting to your preferred language...
        </p>
        <p style={{ margin: "12px 0 0", fontSize: "14px", opacity: 0.72 }}>
          If nothing happens, open <a href={`/en${slugPath}`}>English</a> or{" "}
          <a href={`/zh${slugPath}`}>简体中文</a>.
        </p>
      </div>
    </main>
  );
}
