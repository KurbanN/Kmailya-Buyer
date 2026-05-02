/**
 * Освобождает TCP-порт на Windows (taskkill по PID из netstat).
 * Использование: node scripts/free-port.cjs 3000
 */
const { execSync } = require("node:child_process")

const port = process.argv[2] || "3000"

try {
  const out = execSync(`netstat -ano | findstr :${port}`, {
    encoding: "utf8",
    windowsHide: true,
  })
  const pids = new Set()
  for (const line of out.split("\n")) {
    if (!line.includes("LISTENING")) continue
    const parts = line.trim().split(/\s+/)
    const pid = parts[parts.length - 1]
    if (pid && /^\d+$/.test(pid)) pids.add(pid)
  }
  if (pids.size === 0) {
    console.log(`[free-port] На порту ${port} никто не слушает.`)
    process.exit(0)
  }
  for (const pid of pids) {
    console.log(`[free-port] Завершаю процесс PID ${pid} (порт ${port})…`)
    execSync(`taskkill /PID ${pid} /F`, { stdio: "inherit" })
  }
} catch (e) {
  const msg = e instanceof Error ? e.message : String(e)
  if (msg.includes("findstr") || msg.includes("not find")) {
    console.log(`[free-port] На порту ${port} слушатель не найден.`)
    process.exit(0)
  }
  console.error("[free-port]", msg)
  process.exit(1)
}
