import { test, expect } from '@playwright/test'

/** 세팅 완료 후 전투 시작까지 공통 헬퍼 */
async function setupAndStartBattle(page: import('@playwright/test').Page, difficulty: 'easy' | 'normal' | 'hard' = 'easy') {
  await page.goto('/')

  // Step 1: 이름 + 스탯 (고ATK 빌드)
  await page.getByTestId('name-input').fill('용사')
  await page.getByTestId('stat-hp').fill('100')
  await page.getByTestId('stat-mp').fill('50')
  await page.getByTestId('stat-atk').fill('20')
  await page.getByTestId('stat-def').fill('15')
  await page.getByTestId('stat-spd').fill('15')
  await page.getByTestId('next-button').click()

  // Step 2: 스킬 (기본만)
  await page.getByTestId('next-button').click()

  // Step 3: 난이도 선택 + 전투 시작
  await page.getByTestId(`difficulty-${difficulty}`).click()
  await page.getByTestId('start-battle-button').click()

  // 전투 화면 로딩 확인
  await expect(page.getByTestId('round-display')).toBeVisible()
}

/** 큐 소비 애니메이션 완료까지 대기 (버튼 활성화 확인) */
async function waitForAnimationEnd(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('skill-button-0')).toBeEnabled({ timeout: 5000 })
}

test.describe('전투 플로우', () => {
  test('전투 시작 시 양쪽 캐릭터 정보 표시', async ({ page }) => {
    await setupAndStartBattle(page)

    await expect(page.getByTestId('player-panel')).toBeVisible()
    await expect(page.getByTestId('enemy-panel')).toBeVisible()
    await expect(page.getByTestId('player-name')).toHaveText('용사')
    await expect(page.getByTestId('enemy-name')).toBeVisible()
    await expect(page.getByTestId('round-display')).toHaveText('Round 1')
  })

  test('공격 → 로그에 기록', async ({ page }) => {
    await setupAndStartBattle(page)

    await page.getByTestId('skill-button-0').click()
    await waitForAnimationEnd(page)

    const log = page.getByTestId('battle-log')
    await expect(log).not.toHaveText('전투를 시작하세요...')
  })

  test('방어 버튼 클릭', async ({ page }) => {
    await setupAndStartBattle(page)

    await page.getByTestId('skill-button-1').click()
    await waitForAnimationEnd(page)

    const log = page.getByTestId('battle-log')
    await expect(log).toContainText('방어')
  })

  test('여러 라운드 진행 → 라운드 숫자 증가', async ({ page }) => {
    await setupAndStartBattle(page)

    // 2라운드 진행
    await page.getByTestId('skill-button-0').click()
    await waitForAnimationEnd(page)
    await page.getByTestId('skill-button-0').click()
    await waitForAnimationEnd(page)

    const roundText = await page.getByTestId('round-display').textContent()
    const roundNum = parseInt(roundText?.replace('Round ', '') ?? '0')
    expect(roundNum).toBeGreaterThanOrEqual(2)
  })
})
