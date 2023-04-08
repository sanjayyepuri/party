/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  async redirects () {
    return [
      {
       destination: "http://localhost:8000/:path*",
       source: "/api/:path*",
       permanent: true,
      }
    ]
  }
}

module.exports = nextConfig
