/**
 * Запуск `next dev` с NEXT_WEBPACK_POLLING=1 (см. next.config.mjs).
 * Используйте, если без webpack polling не подхватываются изменения файлов.
 */
const { spawn } = require("node:child_process")

spawn(
  "npx",
  ["next", "dev", "-p", "3000", "-H", "127.0.0.1"],
  {
    stdio: "inherit",
    shell: true,
    env: { ...process.env, NEXT_WEBPACK_POLLING: "1" },
  },
).on("exit", (code) => process.exit(code ?? 0))
