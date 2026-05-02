/**
 * Единая точка входа для `npm run dev`.
 * - Хост по умолчанию 127.0.0.1 — меньше рассинхрона localhost / IPv6 на Windows.
 * - Порт: `node scripts/start-dev.cjs 3001` или переменная PORT, иначе 3000.
 * - При «голой» странице без Tailwind: см. app/globals.css @source; при 404 / timeout на `/_next/static/**`
 *   (ChunkLoadError, layout.js): `npm run dev:fix` или `npm run dev:poll`, либо NEXT_WEBPACK_POLLING=1 в .env.local.
 */
const { spawn } = require("node:child_process")

const port = process.argv[2] ?? process.env.PORT ?? "3000"
const host = process.env.DEV_HOST ?? "127.0.0.1"

const env = { ...process.env, PORT: String(port) }
if (process.platform === "win32") {
  env.CHOKIDAR_USEPOLLING = process.env.CHOKIDAR_USEPOLLING ?? "1"
}

const child = spawn("npx", ["next", "dev", "-p", String(port), "-H", host], {
  stdio: "inherit",
  shell: true,
  env,
})

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 0)
})
