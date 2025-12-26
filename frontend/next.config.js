/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/api/v1/:path*' // Proxy to backend in docker
      }
    ]
  }
}

module.exports = nextConfig
