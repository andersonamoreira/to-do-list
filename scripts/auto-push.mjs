import { watch } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DEBOUNCE_MS = 8000

const IGNORED = ['.git', 'node_modules', 'dist', 'coverage', '.db', '.db-journal', '.db-wal', '.db-shm']

let timer = null
let pending = false

function shouldIgnore(filename) {
  if (!filename) return true
  return IGNORED.some(ig => filename.replace(/\\/g, '/').includes(ig))
}

function commitAndPush() {
  pending = false
  try {
    const status = execSync('git status --porcelain', { cwd: ROOT }).toString().trim()
    if (!status) return

    const now = new Date().toLocaleString('pt-BR')
    execSync('git add .', { cwd: ROOT, stdio: 'pipe' })
    execSync(`git commit -m "auto: ${now}"`, { cwd: ROOT, stdio: 'pipe' })
    execSync('git push origin main', { cwd: ROOT, stdio: 'pipe' })
    console.log(`\n[git] ✓ GitHub atualizado em ${now}`)
  } catch (err) {
    const msg = err.stderr?.toString() ?? err.message ?? ''
    if (!msg.includes('nothing to commit') && !msg.includes('nothing added')) {
      console.error(`\n[git] ✗ Erro ao enviar:`, msg.split('\n')[0])
    }
  }
}

watch(ROOT, { recursive: true }, (_, filename) => {
  if (shouldIgnore(filename)) return
  if (!pending) {
    pending = true
    process.stdout.write(`\n[git] Alteração detectada, enviando em ${DEBOUNCE_MS / 1000}s...`)
  }
  clearTimeout(timer)
  timer = setTimeout(commitAndPush, DEBOUNCE_MS)
})

console.log(`[git] Monitorando alterações (push automático após ${DEBOUNCE_MS / 1000}s sem mudanças)`)
