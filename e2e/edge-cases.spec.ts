import { test, expect } from '@playwright/test'

/** 세팅 완료 후 전투 시작까지 공통 헬퍼 */
async function setupAndStartBattle(
  page: import('@playwright/test').Page,
  options: {
    stats?: { hp: string; mp: string; atk: string; def: string; spd: string }
    difficulty?: 'easy' | 'normal' | 'hard'
    customSkills?: Array<{ name: string; type?: string }>
  } = {},
) {
  const {
    stats = { hp: '100', mp: '50', atk: '20', def: '15', spd: '15' },
    difficulty = 'easy',
    customSkills = [],
  } = options
  await page.goto('/')

  // Step 1
  await page.getByTestId('name-input').fill('테스터')
  await page.getByTestId('stat-hp').fill(stats.hp)
  await page.getByTestId('stat-mp').fill(stats.mp)
  await page.getByTestId('stat-atk').fill(stats.atk)
  await page.getByTestId('stat-def').fill(stats.def)
  await page.getByTestId('stat-spd').fill(stats.spd)
  await page.getByTestId('next-button').click()

  // Step 2: 커스텀 스킬
  for (const skill of customSkills) {
    await page.getByTestId('add-skill-button').click()
    await page.getByTestId('skill-name-input').fill(skill.name)
    if (skill.type) {
      await page.getByText(skill.type, { exact: true }).click()
    }
    await page.getByTestId('submit-skill-button').click()
    await expect(page.getByText(skill.name)).toBeVisible()
  }
  await page.getByTestId('next-button').click()

  // Step 3
  await page.getByTestId(`difficulty-${difficulty}`).click()
  await page.getByTestId('start-battle-button').click()
  await expect(page.getByTestId('round-display')).toBeVisible()
}

/** 전투를 결과 화면까지 진행 */
async function playUntilResult(page: import('@playwright/test').Page) {
  for (let i = 0; i < 25; i++) {
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
  await expect(page.getByTestId('result-title')).toBeVisible({ timeout: 20000 })
}

test.describe('엣지 케이스: 커스텀 스킬 제한', () => {
  test('커스텀 스킬 2개 추가 후 추가 버튼 사라짐', async ({ page }) => {
    await page.goto('/')

    // Step 1 완료
    await page.getByTestId('name-input').fill('테스터')
    await page.getByTestId('stat-hp').fill('100')
    await page.getByTestId('stat-mp').fill('50')
    await page.getByTestId('stat-atk').fill('20')
    await page.getByTestId('stat-def').fill('15')
    await page.getByTestId('stat-spd').fill('15')
    await page.getByTestId('next-button').click()

    // 첫 번째 스킬 추가
    await page.getByTestId('add-skill-button').click()
    await page.getByTestId('skill-name-input').fill('화염참')
    await page.getByTestId('submit-skill-button').click()
    await expect(page.getByText('화염참')).toBeVisible()

    // 두 번째 스킬 추가
    await page.getByTestId('add-skill-button').click()
    await page.getByTestId('skill-name-input').fill('빙결파')
    await page.getByTestId('submit-skill-button').click()
    await expect(page.getByText('빙결파')).toBeVisible()

    // 추가 버튼이 사라져야 함 (최대 2개)
    await expect(page.getByTestId('add-skill-button')).not.toBeVisible()

    // 하나 삭제하면 다시 추가 가능
    await page.getByTestId('remove-skill-button').first().click()
    await expect(page.getByTestId('add-skill-button')).toBeVisible()
  })
})

test.describe('엣지 케이스: 난이도별 전투 완주', () => {
  test('쉬움 난이도 전투 완주 → 결과 화면', async ({ page }) => {
    await setupAndStartBattle(page, {
      stats: { hp: '80', mp: '30', atk: '30', def: '30', spd: '30' },
      difficulty: 'easy',
    })

    await playUntilResult(page)

    const resultText = await page.getByTestId('result-title').textContent()
    expect(['승리', '패배', '무승부']).toContain(resultText)
    await expect(page.getByTestId('result-turns')).toBeVisible()
  })

  test('보통 난이도 전투 완주 → 결과 화면', async ({ page }) => {
    await setupAndStartBattle(page, {
      stats: { hp: '80', mp: '30', atk: '30', def: '30', spd: '30' },
      difficulty: 'normal',
    })

    await playUntilResult(page)

    const resultText = await page.getByTestId('result-title').textContent()
    expect(['승리', '패배', '무승부']).toContain(resultText)
  })

  test('어려움 난이도 전투 완주 → 결과 화면', async ({ page }) => {
    await setupAndStartBattle(page, {
      stats: { hp: '80', mp: '30', atk: '30', def: '30', spd: '30' },
      difficulty: 'hard',
    })

    await playUntilResult(page)

    const resultText = await page.getByTestId('result-title').textContent()
    expect(['승리', '패배', '무승부']).toContain(resultText)
  })
})

test.describe('엣지 케이스: 전투 결과 화면 상세', () => {
  test('결과 화면에 전투 요약 표시 (HP바 + 통계)', async ({ page }) => {
    await setupAndStartBattle(page, {
      stats: { hp: '80', mp: '30', atk: '30', def: '30', spd: '30' },
      difficulty: 'easy',
    })

    await playUntilResult(page)

    // 전투 요약 섹션 표시 확인
    await expect(page.getByText('전투 요약')).toBeVisible()
    await expect(page.getByText('총 데미지').first()).toBeVisible({ timeout: 5000 })

    // 다시 시작 버튼 동작
    await page.getByTestId('restart-button').click()
    await expect(page.getByTestId('name-input')).toBeVisible()
  })
})

test.describe('엣지 케이스: 방어 행동', () => {
  test('방어만으로 여러 턴 버티기', async ({ page }) => {
    await setupAndStartBattle(page, {
      stats: { hp: '100', mp: '35', atk: '5', def: '30', spd: '30' },
      difficulty: 'easy',
    })

    // 방어만 5턴 수행
    for (let i = 0; i < 5; i++) {
      if (await page.getByTestId('result-title').isVisible().catch(() => false)) break
      const btn = page.getByTestId('skill-button-1') // 방어 버튼
      try {
        await expect(btn).toBeEnabled({ timeout: 5000 })
        await btn.click()
        await expect(page.getByTestId('skill-button-0')).toBeEnabled({ timeout: 5000 })
      } catch {
        break
      }
    }

    // 방어 로그가 있어야 함
    const log = page.getByTestId('battle-log')
    await expect(log).toContainText('방어')

    // 플레이어 패널이 여전히 표시되어야 함 (살아있음)
    await expect(page.getByTestId('player-panel')).toBeVisible()
  })
})
