import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props { children: ReactNode }
interface State { failed: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State { return { failed: true }; }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Page render failed", error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return <main className="error-screen"><AlertTriangle size={32} /><h1>Something went wrong</h1><p>Reload the page to try again.</p><button className="button primary" onClick={() => window.location.reload()}>Reload app</button></main>;
    }
    return this.props.children;
  }
}
