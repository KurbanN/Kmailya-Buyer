/**
 * Собирает переносимую папку `dist/` для VPS/PaaS с Node.js (не для чистого PHP-хостинга).
 * После `npm run dist` загрузите всё содержимое `dist/` на сервер и запустите `node server.js`.
 */
const { spawnSync } = require("node:child_process")
const fs = require("node:fs")
const path = require("node:path")

const root = path.join(__dirname, "..")
const dist = path.join(root, "dist")

fs.rmSync(dist, { recursive: true, force: true })

const npm = process.platform === "win32" ? "npm.cmd" : "npm"
const build = spawnSync(npm, ["run", "build"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
})
if (build.status !== 0) {
  process.exit(build.status ?? 1)
}

const standalone = path.join(root, ".next", "standalone")
if (!fs.existsSync(standalone)) {
  console.error("[package-dist] Нет .next/standalone — проверьте output: 'standalone' в next.config.mjs")
  process.exit(1)
}

fs.cpSync(standalone, dist, { recursive: true })

const staticSrc = path.join(root, ".next", "static")
const staticDest = path.join(dist, ".next", "static")
fs.mkdirSync(path.dirname(staticDest), { recursive: true })
fs.cpSync(staticSrc, staticDest, { recursive: true })

const pubSrc = path.join(root, "public")
const pubDest = path.join(dist, "public")
if (fs.existsSync(pubSrc)) {
  fs.cpSync(pubSrc, pubDest, { recursive: true })
}

const readme = `Kamilya — Next.js standalone build
================================

Требования на сервере:
  - Node.js 18.17+ (как в package.json)
  - Переменные окружения как в .env.local (Firebase, NEXT_PUBLIC_*, и т.д.)

Запуск из этой папки (dist):
  Linux/macOS:  PORT=3000 node server.js
  Windows:      set PORT=3000 && node server.js

Обычно перед приложением ставят Nginx reverse-proxy на порт 3000 и SSL.

Это НЕ набор статических HTML для обычного PHP-хостинга — без Node.js сайт не запустится.
`

fs.writeFileSync(path.join(dist, "DEPLOY.txt"), readme, "utf8")

console.log("[package-dist] Готово:", dist)
console.log("[package-dist] На сервере: cd в dist → node server.js")
