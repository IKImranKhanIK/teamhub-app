"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
}

// React error boundaries must be class components — there is no hook equivalent.
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      `[ErrorBoundary${this.props.name ? ` — ${this.props.name}` : ""}]`,
      error,
      info.componentStack,
    );
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#1a1f2e] border border-red-500/30 rounded-2xl p-10 text-center">
          <p className="text-3xl mb-3">⚠️</p>
          <p className="text-white font-semibold mb-1">Something went wrong in this section.</p>
          <p className="text-slate-400 text-sm mb-5">An unexpected error occurred while rendering this tab.</p>
          <button
            onClick={this.reset}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
