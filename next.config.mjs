/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cabeçalhos para a PWA poder ser instalada e o service worker funcionar.
  async headers() {
    return [
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};
export default nextConfig;
