import React, { Component, ErrorInfo, ReactNode } from "react";
import { reportError } from "../lib/observability";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  route?: string;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportError(error, {
      source: "ui",
      route: this.props.route || (typeof window !== "undefined" ? window.location.pathname : "/"),
      operation: "react_render",
    });

    if (import.meta.env?.DEV) {
      console.error("[ErrorBoundary caught component failure]", error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[300px] w-full items-center justify-center p-6">
          <div className="max-w-md text-center border border-border bg-card/60 p-8 backdrop-blur-md">
            <h2 className="font-serif text-xl font-bold text-foreground">
              Ops, algo não saiu como o esperado.
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Tivemos uma instabilidade temporária. Tente recarregar a página para continuar.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center justify-center rounded-none bg-accent px-5 py-2 text-xs font-bold uppercase tracking-wider text-accent-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                Tentar novamente
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-none border border-border bg-card px-5 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Página inicial
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
