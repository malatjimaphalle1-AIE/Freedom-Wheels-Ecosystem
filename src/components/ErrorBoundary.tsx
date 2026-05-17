import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#05070a] text-accent-blue flex flex-col items-center justify-center p-8 font-mono">
          <div className="max-w-2xl w-full border border-red-500/30 bg-red-500/5 p-8 rounded-lg shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <h1 className="text-xl font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              Sovereign_System_Failure
            </h1>
            <p className="text-[11px] uppercase tracking-widest text-text-dim mb-6 border-b border-white/10 pb-2">
              Critical Runtime Exception Detected
            </p>
            <div className="bg-black/50 p-4 rounded border border-white/5 overflow-auto max-h-[300px] mb-6">
              <pre className="text-[10px] text-red-400 font-mono whitespace-pre-wrap">
                {this.state.error?.stack || this.state.error?.message}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500 text-bg text-[10px] font-black uppercase tracking-[0.2em] rounded hover:bg-red-400 transition-all"
            >
              Attempt Core Reboot
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
