import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Short label shown to the user, e.g. the view name. */
  label?: string;
  /** "app" renders a full-screen fallback; "view" renders an inline one. */
  scope?: "app" | "view";
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time errors (including failed lazy chunk loads) so one broken
 * view cannot blank the whole application.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.label ?? this.props.scope ?? "view"}]`, error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  private reload = () => window.location.reload();

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const isChunkError = /Loading chunk|dynamically imported module|Importing a module script failed/i.test(
      error.message || "",
    );
    const full = this.props.scope === "app";

    return (
      <div
        role="alert"
        className={`flex flex-col items-center justify-center text-center px-6 ${full ? "min-h-screen" : "py-24"}`}
      >
        <h2 className="text-xl font-semibold mb-2">
          {isChunkError ? "A new version is available" : `Something went wrong${this.props.label ? ` in ${this.props.label}` : ""}`}
        </h2>
        <p className="text-sm opacity-70 max-w-md mb-6">
          {isChunkError
            ? "Part of the app could not be loaded. Reload the page to get the latest version."
            : "This section hit an unexpected error. Your progress is saved. You can try again or reload the page."}
        </p>
        <div className="flex gap-3">
          {!isChunkError && (
            <button
              type="button"
              onClick={this.reset}
              className="px-4 py-2 rounded-lg border border-current/30 text-sm font-medium hover:opacity-80"
            >
              Try again
            </button>
          )}
          <button
            type="button"
            onClick={this.reload}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
