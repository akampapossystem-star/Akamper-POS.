
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary class component to catch JavaScript errors anywhere in its child component tree.
 */
// Fix: Explicitly use React.Component to resolve TypeScript inheritance issues
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Fix: Initializing state in the constructor
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Static lifecycle method to update state when an error occurs.
   * @param error The error that was thrown.
   */
  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  /**
   * Lifecycle method to catch errors in the component tree.
   * @param error The error that was thrown.
   * @param errorInfo An object with information about which component threw the error.
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Fix: Using the inherited setState method
    this.setState({ errorInfo });
  }

  public render(): ReactNode {
    // Fix: Accessing state safely
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-2xl border-t-8 border-red-600">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">System Malfunction</h1>
            <p className="text-gray-500 text-sm font-medium mb-6">
              The system encountered a critical error.
            </p>
            <div className="bg-gray-100 p-4 rounded-xl text-left mb-6 overflow-hidden border border-gray-200">
                <p className="text-xs font-mono text-red-600 font-bold break-all">
                    {/* Fix: Accessing error from the inherited state object */}
                    {this.state.error?.toString() || "Unknown Error"}
                </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" /> Reboot System
            </button>
          </div>
        </div>
      );
    }

    // Fix: Accessing the children property through inherited props
    return this.props.children;
  }
}

export default ErrorBoundary;
