/** Удаляет каталог `.next` (исправляет «missing chunk», битый middleware-manifest и т.п.). */
const fs = require("node:fs")
const path = require("node:path")
const { spawnSync } = require("node:child_process")

const dir = path.join(process.cwd(), ".next")
const MAX_ATTEMPTS = 5

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

function removeWithPowerShell(target) {
  const command = `if (Test-Path -LiteralPath '${target.replace(/'/g, "''")}') { Remove-Item -LiteralPath '${target.replace(/'/g, "''")}' -Recurse -Force -ErrorAction SilentlyContinue }`
  const result = spawnSync("powershell", ["-NoProfile", "-Command", command], {
    windowsHide: true,
    stdio: "ignore",
  })
  return result.status === 0
}

let lastError = null

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
    console.log("[clean-next] Удалено:", dir)
    process.exit(0)
  } catch (e) {
    if (e && e.code === "ENOENT") {
      console.log("[clean-next] Каталог .next уже отсутствует.")
      process.exit(0)
    }
    if (e && (e.code === "ENOTEMPTY" || e.code === "EBUSY" || e.code === "EPERM")) {
      lastError = e
      if (attempt === Math.ceil(MAX_ATTEMPTS / 2)) {
        removeWithPowerShell(dir)
      }
      sleep(180 * attempt)
      continue
    }
    throw e
  }
}

if (lastError) throw lastError
