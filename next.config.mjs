/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pokopia.pokemon.com",
      },
      {
        protocol: "https",
        hostname: "assets.pokemon.com",
      },
    ],
  },
}

export default nextConfig
