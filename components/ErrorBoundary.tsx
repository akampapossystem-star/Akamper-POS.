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
 * ErrorBoundary component to catch rendering errors in child components.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden animate-in zoom-in duration-300">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-800 mb-2 uppercase tracking-tight">System Malfunction</h1>
            <p className="text-gray-500 text-sm font-medium mb-6">
              The system encountered a critical error and had to stop.
            </p>
            
            <div className="bg-gray-100 p-4 rounded-xl text-left mb-6 overflow-hidden border border-gray-200">
                <p className="text-xs font-mono text-red-600 font-bold break-all">
                    {this.state.error?.toString() || "Unknown Error"}
                </p>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <RefreshCcw className="w-4 h-4" /> Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;