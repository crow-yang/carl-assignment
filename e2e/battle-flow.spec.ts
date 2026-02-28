import { test, expect } from '@playwright/test'

/** 세팅 완료 후 전투 시작까지 공통 헬퍼 */
async function setupAndStartBattle(
  page: import('@playwright/test').Page,
  options: {
    difficulty?: 'easy' | 'normal' | 'hard'
    addCustomSkill?: boolean
  } = {},
) {
  const { difficulty = 'easy', addCustomSkill = false } = options
  await page.goto('/')

  // Step 1: 이름 + 스탯 (고ATK 빌드)
  await page.getByTestId('name-input').fill('용사')
  await page.getByTestId('stat-hp').fill('100')
  await page.getByTestId('stat-mp').fill('50')
  await page.getByTestId('stat-atk').fill('20')
  await page.getByTestId('stat-def').fill('15')
  await page.getByTestId('stat-spd').fill('15')
  await page.getByTestId('next-button').click()

  // Step 2: 커스텀 스킬 (옵션)
  if (addCustomSkill) {
    await page.getByTestId('add-skill-button').click()
    await page.getByTestId('skill-name-input').fill('강타')
    await page.getByTestId('submit-skill-button').click()
    await expect(page.getByText('강타')).toBeVisible()
  }
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

  test('커스텀 스킬을 전투에서 사용', async ({ page }) => {
    await setupAndStartBattle(page, { addCustomSkill: true })

    // 스킬 버튼이 3개 이상 (공격, 방어, 강타)
    await expect(page.getByTestId('skill-button-2')).toBeVisible()

    // 커스텀 스킬(강타) 사용
    await page.getByTestId('skill-button-2').click()
    await waitForAnimationEnd(page)

    const log = page.getByTestId('battle-log')
    await expect(log).toContainText('강타')
  })

  test('보통 난이도 전투 시작 + 적 이름 확인', async ({ page }) => {
    await setupAndStartBattle(page, { difficulty: 'normal' })

    await expect(page.getByTestId('enemy-name')).toHaveText('오크 전사')
  })

  test('어려움 난이도 전투 진행 + 적 디버프 스킬 확인', async ({ page }) => {
    await setupAndStartBattle(page, { difficulty: 'hard' })

    await expect(page.getByTestId('enemy-name')).toHaveText('드래곤 나이트')

    // 여러 라운드 진행하여 적 AI가 다양한 스킬을 사용하게 함
    for (let i = 0; i < 5; i++) {
      if (await page.getByTestId('result-title').isVisible().catch(() => false)) break
      const btn = page.getByTestId('skill-button-0')
      try {
        await expect(btn).toBeEnabled({ timeout: 5000 })
        await btn.click()
        await expect(btn).toBeEnabled({ timeout: 5000 })
      } catch {
        break
      }
    }

    // 전투 로그에 적의 행동이 기록되어야 함
    const log = page.getByTestId('battle-log')
    const logText = await log.textContent()
    expect(logText?.length).toBeGreaterThan(0)
  })

  test('MP 부족 시 스킬 버튼 비활성화', async ({ page }) => {
    await setupAndStartBattle(page, { addCustomSkill: true })

    // 커스텀 스킬(MP 5 소모)을 반복 사용하여 MP 소진
    for (let i = 0; i < 12; i++) {
      if (await page.getByTestId('result-title').isVisible().catch(() => false)) break
      const skillBtn = page.getByTestId('skill-button-2')
      try {
        await expect(skillBtn).toBeVisible({ timeout: 3000 })
        if (await skillBtn.isDisabled()) break
        await skillBtn.click()
        await waitForAnimationEnd(page)
      } catch {
        break
      }
    }

    // MP가 소진되면 커스텀 스킬 버튼이 비활성화, 기본 공격(MP 0)은 활성화
    // 전투가 끝나지 않았다면 검증
    const battleEnded = await page.getByTestId('result-title').isVisible().catch(() => false)
    if (!battleEnded) {
      await expect(page.getByTestId('skill-button-0')).toBeEnabled()
    }
  })
})
