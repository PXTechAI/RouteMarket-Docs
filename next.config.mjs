import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();
const basePath = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);

/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  ...(basePath ? { basePath } : {})
};

export default withMDX(nextConfig);

function normalizeBasePath(value) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "/") {
    return undefined;
  }

  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}
