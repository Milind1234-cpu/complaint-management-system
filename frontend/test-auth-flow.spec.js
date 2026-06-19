/**
 * Auth flow test — uses Playwright browser automation.
 * Run with: npx playwright test test-auth-flow.spec.js
 *
 * NOTE: Requires Playwright browsers installed first:
 *   node node_modules/@playwright/test/cli.js install chromium
 */

const { test, expect } = require('@playwright/test')
const path = require('path')
const fs   = require('fs')

const BASE_URL       = 'http://localhost:5174'
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots')

const TEST_USER = {
  name:     'Test Customer',
  email:    'customer2@test.com',
  password: 'test1234',
}

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

test.describe('Auth flow — register → login → dashboard', () => {
  test.setTimeout(60_000)

  test('full auth flow', async ({ page }) => {
    // STEP 3 — Register
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' })
    const regPromise = page.waitForResponse(
      r => r.url().includes('/api/auth/register') && r.request().method() === 'POST',
      { timeout: 15_000 }
    )
    await page.locator('input[autocomplete="name"], input[placeholder*="name" i]').first().fill(TEST_USER.name)
    await page.locator('input[type="email"]').fill(TEST_USER.email)
    await page.locator('input[type="password"]').fill(TEST_USER.password)
    await page.locator('button[type="submit"]').click()
    const regRes    = await regPromise
    const regStatus = regRes.status()
    console.log(`STEP 3 — Register: HTTP ${regStatus}`)
    expect([200, 201, 400]).toContain(regStatus) // 400 = already exists (re-run safe)

    // STEP 4 — Confirm redirect
    await page.waitForTimeout(1500)
    const afterReg = page.url()
    console.log(`STEP 4 — After register URL: ${afterReg}`)
    expect(afterReg).not.toContain('/register')

    // STEP 5 & 6 — Login
    if (!afterReg.includes('/login')) await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    const loginPromise = page.waitForResponse(
      r => r.url().includes('/api/auth/login') && r.request().method() === 'POST',
      { timeout: 15_000 }
    )
    await page.locator('input[type="email"]').fill(TEST_USER.email)
    await page.locator('input[type="password"]').fill(TEST_USER.password)
    await page.locator('button[type="submit"]').click()
    const loginRes    = await loginPromise
    const loginStatus = loginRes.status()
    console.log(`STEP 6 — Login: HTTP ${loginStatus}`)
    expect(loginStatus).toBe(200)

    // STEP 7 — Token in localStorage
    await page.waitForTimeout(1500)
    const storage = await page.evaluate(() => {
      const out = {}
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i); out[k] = localStorage.getItem(k)
      }
      return out
    })
    console.log('STEP 7 — localStorage:', JSON.stringify(storage, null, 2))
    const token = storage['cms_token'] || storage['token'] || storage['access_token']
    expect(token).toBeTruthy()

    // STEP 8 — Navigated away from login
    const finalUrl = page.url()
    console.log(`STEP 8 — Final URL: ${finalUrl}`)
    expect(finalUrl).not.toContain('/login')

    // STEP 9 — Screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, 'post-login.png')
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`STEP 9 — Screenshot: ${screenshotPath}`)
    expect(fs.existsSync(screenshotPath)).toBe(true)
  })
})
