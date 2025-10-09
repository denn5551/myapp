/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
async rewrites() {
    return [
      // Любые запросы к /uploads/* проксируем в API-роут,
      // который безопасно отдаёт файл из /public/uploads/*
      { source: '/uploads/:path*', destination: '/api/static/uploads/:path*' },
    ]
  },
}
module.exports = nextConfig
