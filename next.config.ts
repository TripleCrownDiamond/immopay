import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  async headers() {
    return ["/invitation/:path*", "/reinitialiser-mot-de-passe"].map(source => ({
      source, headers: [{key:"Referrer-Policy",value:"no-referrer"}],
    }));
  },
};
export default nextConfig;
