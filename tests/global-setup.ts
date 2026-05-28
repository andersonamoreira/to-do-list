import { execSync } from 'node:child_process'
import { existsSync, unlinkSync } from 'node:fs'

const TEST_DB = './prisma/test.db'

export default async function setup() {
  if (existsSync(TEST_DB)) {
    unlinkSync(TEST_DB)
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: 'file:./prisma/test.db' },
  })
}

export async function teardown() {
  if (existsSync(TEST_DB)) {
    unlinkSync(TEST_DB)
  }
}
