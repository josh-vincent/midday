// Sentry removed for MVP - can be re-enabled later if needed
// import { withSentryConfig } from "@sentry/nextjs";

/** @type {import("next").NextConfig} */
const config = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    loader: "custom",
    loaderFile: "./image-loader.ts",
    qualities: [80, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  transpilePackages: [
    "@midday/ui",
    "@midday/tailwind",
    "@midday/invoice",
    "@midday/api",
  ],
  serverExternalPackages: ["@react-pdf/renderer", "pdfjs-dist"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/((?!api/proxy).*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

// Export config directly - Sentry can be re-enabled later if needed
export default config;
