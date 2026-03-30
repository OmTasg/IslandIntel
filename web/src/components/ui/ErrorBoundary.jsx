import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export class ChartErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { didCatch: false, errorMessage: null }
  }

  static getDerivedStateFromError() {
    return { didCatch: true }
  }

  componentDidCatch(error, info) {
    console.error('ChartErrorBoundary', error, info)
    this.setState({ errorMessage: error?.message ?? String(error) })
  }

  render() {
    if (this.state.didCatch) {
      return (
        <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-rose-900/50 bg-rose-950/20 px-4 text-center">
          <AlertTriangle className="h-8 w-8 text-rose-400" aria-hidden />
          <p className="text-sm font-medium text-rose-100">Visualization failed to render</p>
          <p className="max-w-xs text-xs text-slate-500">
            This block is isolated so the rest of the dashboard stays usable.
          </p>
          {this.state.errorMessage ? (
            <pre className="mt-2 max-w-xl whitespace-pre-wrap break-words rounded-md bg-rose-950/30 px-3 py-2 text-[11px] text-rose-100">
              {this.state.errorMessage}
            </pre>
          ) : null}
        </div>
      )
    }
    return this.props.children
  }
}
