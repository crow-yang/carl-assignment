import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

function ThrowingChild(): never {
  throw new Error('테스트 에러')
}

function GoodChild() {
  return <p>정상 렌더</p>
}

describe('ErrorBoundary', () => {
  it('에러 없으면 자식을 그대로 렌더링', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    )
    expect(screen.getByText('정상 렌더')).toBeDefined()
  })

  it('자식이 에러를 던지면 fallback UI 표시', () => {
    // console.error 억제 (React가 에러 바운더리 에러를 로깅)
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    )

    expect(screen.getByText('오류가 발생했습니다')).toBeDefined()
    expect(screen.getByText('페이지를 새로고침 해주세요.')).toBeDefined()
    expect(screen.getByRole('button', { name: '새로고침' })).toBeDefined()

    spy.mockRestore()
  })

  it('componentDidCatch가 에러를 console.error로 로깅', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    )

    const boundaryLog = spy.mock.calls.find(
      (args) => args[0] === '[ErrorBoundary]',
    )
    expect(boundaryLog).toBeDefined()
    expect(boundaryLog![1]).toBeInstanceOf(Error)
    expect(boundaryLog![1].message).toBe('테스트 에러')

    spy.mockRestore()
  })
})
