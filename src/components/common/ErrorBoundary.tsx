import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Unexpected application error',
    };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F6F8FC] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 text-center space-y-4">
            <h1 className="text-xl font-bold text-[#102B50]">
              পৃষ্ঠাটি লোড করতে সাময়িক সমস্যা হয়েছে / Something went wrong
            </h1>
            <p className="text-sm text-[#617187] leading-relaxed">
              অনুগ্রহ করে পৃষ্ঠাটি পুনরায় লোড করুন। / Please reload the page to continue browsing BEPZA Public School and College, Ishwardi EPZ.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#102B50] hover:bg-[#1F5FAF] text-white text-sm font-semibold transition-colors"
            >
              পুনরায় লোড করুন / Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
