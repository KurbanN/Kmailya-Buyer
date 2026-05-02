/** Сборка статики для GitHub Pages (Actions задаёт `GITHUB_PAGES=true`). */
const isGithubPages =
  process.env.GITHUB_PAGES === 'true' || process.env.GITHUB_PAGES === '1'

/** Базовый путь на Pages: проект `owner/repo` → `/repo`; репозиторий `user/user.github.io` → корень. */
function githubPagesBasePath() {
  if (!isGithubPages) return ''
  const explicit = process.env.NEXT_PUBLIC_BASE_PATH
  if (typeof explicit === 'string' && explicit !== '') {
    return explicit.startsWith('/') ? explicit : `/${explicit}`
  }
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
  if (!repo) return ''
  const owner = process.env.GITHUB_REPOSITORY?.split('/')[0]
  if (owner && repo === `${owner}.github.io`) return ''
  return `/${repo}`
}

const ghBase = githubPagesBasePath()

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isGithubPages
    ? {
        output: 'export',
        basePath: ghBase,
        assetPrefix: ghBase || undefined,
        trailingSlash: true,
      }
    : {
        /** Артефакт для папки `dist/` (см. `npm run dist`) — один переносимый билд + Node на сервере. */
        output: 'standalone',
      }),
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
