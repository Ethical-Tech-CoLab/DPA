/**
 * Static export configuration.
 *
 * GitHub Pages serves static files only, so there are no route handlers and no
 * server-side redaction at request time. That constraint is turned into a
 * feature: `pnpm fixtures` runs the pipeline at BUILD time and writes one JSON
 * file per (passport, role), each containing only the fields that role may see.
 *
 * The disclosure boundary is therefore provable by inspecting the deployed
 * site — open the network tab, fetch the `public` payload, and confirm the
 * withheld fields are physically absent rather than hidden by the UI.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
