import { test, expect } from '@playwright/test'

test.describe('세팅 플로우', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Step 1: 이름 입력 + 스탯 배분 → 다음 스텝 이동', async ({ page }) => {
    // 이름 입력
    const nameInput = page.getByTestId('name-input')
    await expect(nameInput).toBeVisible()
    await nameInput.fill('용사')

    // 잔여 포인트 확인 (초기: 200 - 55 = 145)
    const remaining = page.getByTestId('remaining-points')
    await expect(remaining).toBeVisible()

    // 스탯 배분: HP 100, MP 50, ATK 20, DEF 15, SPD 15 = 200
    await page.getByTestId('stat-hp').fill('100')
    await page.getByTestId('stat-mp').fill('50')
    await page.getByTestId('stat-atk').fill('20')
    await page.getByTestId('stat-def').fill('15')
    await page.getByTestId('stat-spd').fill('15')

    // 잔여 0이면 다음 버튼 활성화
    await expect(remaining).toHaveText('0')

    const nextBtn = page.getByTestId('next-button')
    await expect(nextBtn).toBeEnabled()
    await nextBtn.click()

    // Step 2로 이동 → 기본 스킬이 보여야 함
    await expect(page.getByText('기본 스킬')).toBeVisible()
  })

  test('Step 1: 잔여 포인트가 0이 아니면 다음 버튼 비활성화', async ({ page }) => {
    await page.getByTestId('name-input').fill('용사')
    // 기본 스탯(55)으로는 잔여 145
    const nextBtn = page.getByTestId('next-button')
    await expect(nextBtn).toBeDisabled()
  })

  test('Step 2: 커스텀 스킬 추가/삭제', async ({ page }) => {
    // Step 1 빠르게 완료
    await page.getByTestId('name-input').fill('용사')
    await page.getByTestId('stat-hp').fill('100')
    await page.getByTestId('stat-mp').fill('50')
    await page.getByTestId('stat-atk').fill('20')
    await page.getByTestId('stat-def').fill('15')
    await page.getByTestId('stat-spd').fill('15')
    await page.getByTestId('next-button').click()

    // 스킬 추가 버튼 클릭
    await page.getByTestId('add-skill-button').click()

    // 스킬 이름 입력 + 생성
    await page.getByTestId('skill-name-input').fill('화염참')
    await page.getByTestId('submit-skill-button').click()

    // 생성된 스킬이 표시되어야 함
    await expect(page.getByText('화염참')).toBeVisible()

    // 삭제
    await page.getByTestId('remove-skill-button').click()
    await expect(page.getByText('화염참')).not.toBeVisible()
  })

  test('Step 2 → Step 3: 난이도 선택 + 전투 시작', async ({ page }) => {
    // Step 1 완료
    await page.getByTestId('name-input').fill('용사')
    await page.getByTestId('stat-hp').fill('100')
    await page.getByTestId('stat-mp').fill('50')
    await page.getByTestId('stat-atk').fill('20')
    await page.getByTestId('stat-def').fill('15')
    await page.getByTestId('stat-spd').fill('15')
    await page.getByTestId('next-button').click()

    // Step 2 → Step 3
    await page.getByTestId('next-button').click()

    // 난이도 선택
    await page.getByTestId('difficulty-easy').click()

    // 전투 시작
    const startBtn = page.getByTestId('start-battle-button')
    await expect(startBtn).toBeEnabled()
    await startBtn.click()

    // 전투 화면으로 전환
    await expect(page.getByTestId('round-display')).toBeVisible()
  })

  test('스텝 간 이동 시 값 보존', async ({ page }) => {
    // Step 1 입력
    await page.getByTestId('name-input').fill('용사')
    await page.getByTestId('stat-hp').fill('100')
    await page.getByTestId('stat-mp').fill('50')
    await page.getByTestId('stat-atk').fill('20')
    await page.getByTestId('stat-def').fill('15')
    await page.getByTestId('stat-spd').fill('15')
    await page.getByTestId('next-button').click()

    // Step 2 → 이전으로 돌아가기
    await page.getByTestId('prev-button').click()

    // 값이 보존되어야 함
    await expect(page.getByTestId('name-input')).toHaveValue('용사')
    await expect(page.getByTestId('stat-hp')).toHaveValue('100')
    await expect(page.getByTestId('stat-mp')).toHaveValue('50')
  })
})
