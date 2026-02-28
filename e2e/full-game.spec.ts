import { test, expect } from '@playwright/test'

test.describe('풀 게임 E2E', () => {
  test('세팅 → 전투 → 결과 → 다시 시작 전체 플로우', async ({ page }) => {
    await page.goto('/')

    // ─── 세팅 ────────────────────────────────────────────
    await page.getByTestId('name-input').fill('용사')
    await page.getByTestId('stat-hp').fill('80')
    await page.getByTestId('stat-mp').fill('30')
    await page.getByTestId('stat-atk').fill('30')
    await page.getByTestId('stat-def').fill('30')
    await page.getByTestId('stat-spd').fill('30')
    await page.getByTestId('next-button').click()
    await page.getByTestId('next-button').click()
    await page.getByTestId('difficulty-easy').click()
    await page.getByTestId('start-battle-button').click()

    // ─── 전투 ────────────────────────────────────────────
    await expect(page.getByTestId('round-display')).toBeVisible()

    // ATK 30 vs easy(HP 80, DEF 8) → ~26 dmg/hit → ~4라운드면 클리어
    for (let i = 0; i < 10; i++) {
      if (await page.getByTestId('result-title').isVisible().catch(() => false)) break

      const btn = page.getByTestId('skill-button-0')
      // 애니메이션 완료 후 버튼이 활성화될 때까지 대기
      try {
        await expect(btn).toBeEnabled({ timeout: 5000 })
        await btn.click()
      } catch {
        break
      }
      // 큐 소비 애니메이션 완료 대기
      try {
        await expect(btn).toBeEnabled({ timeout: 5000 })
      } catch {
        break
      }
    }

    // ─── 결과 ────────────────────────────────────────────
    await expect(page.getByTestId('result-title')).toBeVisible({ timeout: 20000 })
    await expect(page.getByTestId('result-turns')).toBeVisible()

    const resultText = await page.getByTestId('result-title').textContent()
    expect(['승리', '패배', '무승부']).toContain(resultText)

    // ─── 다시 시작 ──────────────────────────────────────
    await page.getByTestId('restart-button').click()
    await expect(page.getByTestId('name-input')).toBeVisible()
  })
})
