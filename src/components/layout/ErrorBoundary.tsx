"use client";

import React, { useEffect } from "react";
import type { ErrorInfo, ReactNode } from "react";

import { AlertCircle, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to monitoring service
    if (process.env.NODE_ENV === "production") {
      console.error("Error caught by boundary:", error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    this.setState({ errorInfo });
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  override render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({
  error,
  resetError,
}) => {
  useEffect(() => {
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error in component:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="mt-2">
            {process.env.NODE_ENV === "development" ? (
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">
                  Error details
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs">
                  {error.message}
                  {error.stack && (
                    <>
                      {"\n\n"}
                      {error.stack}
                    </>
                  )}
                </pre>
              </details>
            ) : (
              <p>
                An unexpected error occurred. Please try refreshing the page.
              </p>
            )}
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button onClick={resetError} variant="default" className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
            className="flex-1"
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
};

// Hook for using error boundary functionality
export const useErrorHandler = () => {
  return (error: Error) => {
    throw error;
  };
};
