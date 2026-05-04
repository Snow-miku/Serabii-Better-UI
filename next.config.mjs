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
      {
        protocol: "https",
        hostname: "www.serebii.net",
      },
      {
        protocol: "https",
        hostname: "serebii.net",
      },
    ],
  },
}

export default nextConfig
