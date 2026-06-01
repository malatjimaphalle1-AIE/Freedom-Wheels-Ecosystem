'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Zap } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Freedom Wheels ErrorBoundary]', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="w-full max-w-md border-fw-border bg-fw-surface">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-fw-red/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-fw-red" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-widest uppercase text-fw-text mb-2">
                  Module Error
                </h3>
                <p className="text-xs text-fw-dim font-mono leading-relaxed">
                  This module encountered an unexpected error. The rest of the ecosystem is still operational.
                </p>
              </div>
              {this.state.error && (
                <div className="p-3 rounded-lg bg-fw-bg border border-fw-border text-left">
                  <p className="text-[10px] text-fw-red font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  size="sm"
                  className="border-fw-border text-fw-dim hover:text-fw-text"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
                <Button
                  onClick={this.handleReload}
                  size="sm"
                  className="bg-fw-accent text-black hover:bg-fw-accent/90"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Reload App
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
