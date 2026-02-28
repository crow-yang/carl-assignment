import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, errorInfo.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-400">오류가 발생했습니다</h1>
            <p className="text-gray-400">페이지를 새로고침 해주세요.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
