import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div role="alert" className="p-6 text-center">
        <h1 className="font-bold text-lg mb-2">Something went wrong</h1>
        <button
          className="bg-primary text-white rounded-lg px-4 py-2"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    );
  }
}
