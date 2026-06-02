import React from 'react';

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#f7f8f1] px-4 text-black">
          <section className="max-w-lg rounded-lg border-2 border-black bg-white p-6 shadow-[8px_8px_0_rgba(5,5,5,0.92)]">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-accent">Datawhale AI+X</p>
            <h1 className="mt-3 text-3xl font-black leading-tight">页面加载遇到问题</h1>
            <p className="mt-3 text-sm font-bold leading-7 text-black/62">
              可以刷新页面重试；如果问题持续出现，活动日历主体服务不会影响已提交活动的审核状态。
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary mt-5 inline-flex items-center justify-center px-5 py-3 text-sm"
            >
              刷新页面
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
