import type { ImgHTMLAttributes } from "react";

type DocImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  caption?: string;
};

const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

export function DocImage({
  alt,
  caption,
  className,
  loading = "lazy",
  src,
  ...props
}: DocImageProps) {
  if (typeof src !== "string") {
    return null;
  }

  const resolvedSrc = src.startsWith("/") ? `${basePath}${src}` : src;

  return (
    <figure className="doc-image">
      <img
        {...props}
        alt={alt ?? ""}
        className={className}
        loading={loading}
        src={resolvedSrc}
      />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function normalizeBasePath(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed || trimmed === "/") {
    return "";
  }

  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}
