"use client";

import { Component, ReactNode } from "react";
import { AlertTriangle, RotateCcw, MessageSquare } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error("GHC dashboard error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-[#0a0f1c] flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-white/10 bg-[#0f172a] p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-400 mb-6">We are working to fix this. Try reloading the page or contact support.</p>
            {this.state.error && <p className="text-xs text-slate-600 mb-6 font-mono break-all">{this.state.error.message}</p>}
            <div className="flex gap-3 justify-center">
              <button onClick={() => window.location.reload()} className="rounded-lg bg-[#00b7ff] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#009fe0] transition-all flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Reload
              </button>
              <a href="/support" className="rounded-lg border border-white/10 text-white px-4 py-2.5 text-sm font-semibold hover:bg-white/5 transition-all flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Support
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
