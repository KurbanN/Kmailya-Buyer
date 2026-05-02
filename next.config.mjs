/** @type {import('next').NextConfig} */
const nextConfig = {
  /** Артефакт для папки `dist/` (см. `npm run dist`) — один переносимый билд + Node на сервере. */
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  /** Реже выкидывать страницы из dev-кэша — меньше обрывов HMR и «битых» layout.css на Windows. */
  onDemandEntries: {
    maxInactiveAge: 5 * 60 * 1000,
    pagesBufferLength: 24,
  },
  /**
   * Раньше на win32 по умолчанию включался webpack `poll` — на части машин это давало гонки и **404 на
   * `/_next/static/**`** (layout.css, main-app.js) после сохранений/HMR.
   * Polling включается только явно: `NEXT_WEBPACK_POLLING=1` (или `true`) в `.env.local`.
   * Если без polling файлы не подхватываются — задайте эту переменную и перезапустите dev.
   * Не переопределяем `watchOptions.ignored` — иначе ломается схема webpack / дефолты Next.
   */
  webpack: (config, { dev }) => {
    if (dev) {
      const usePoll =
        process.platform === "win32" &&
        (process.env.NEXT_WEBPACK_POLLING === "1" ||
          process.env.NEXT_WEBPACK_POLLING === "true")

      if (usePoll) {
        config.watchOptions = {
          ...(config.watchOptions || {}),
          poll: 1000,
          aggregateTimeout: 300,
        }
      }
    }
    return config
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
