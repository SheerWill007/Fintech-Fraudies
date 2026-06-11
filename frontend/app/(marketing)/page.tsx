import Link from "next/link";
import { Shield, TrendingUp, AlertTriangle, Eye, Lock, Zap } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-indigo-500" />
            <span className="text-2xl font-bold text-white">Fraudies</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-white/70 transition-colors hover:text-white">
              Login
            </Link>
            <Link href="/register" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-32 pb-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.15)_0%,_transparent_60%)]" />
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-400">
            <Zap className="h-4 w-4" />
            Real-time Fraud Detection Platform
          </div>
          <h1 className="mb-6 text-6xl font-bold leading-tight text-white md:text-7xl lg:text-8xl">
            Stop Fraud Before<br />It <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Happens</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-300">
            Enterprise-grade fraud monitoring orchestrator powered by machine learning. 
            Protect your transactions with intelligent risk assessment in real-time.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link 
              href="/register" 
              className="rounded-lg bg-indigo-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-indigo-500 hover:scale-105"
            >
              Start Monitoring
            </Link>
            <Link 
              href="/dashboard" 
              className="rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-white backdrop-blur transition-all hover:bg-white/10"
            >
              View Demo
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur">
              <div className="mb-2 text-4xl font-bold text-indigo-400">99.7%</div>
              <div className="text-sm text-slate-400">Detection Accuracy</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur">
              <div className="mb-2 text-4xl font-bold text-indigo-400">&lt;50ms</div>
              <div className="text-sm text-slate-400">Response Time</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6 backdrop-blur">
              <div className="mb-2 text-4xl font-bold text-indigo-400">24/7</div>
              <div className="text-sm text-slate-400">Real-time Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-4xl font-bold text-white md:text-5xl">
            Comprehensive Fraud Protection
          </h2>
          <p className="mb-16 text-center text-lg text-slate-400">
            Advanced machine learning models analyze every transaction in real-time
          </p>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 backdrop-blur">
              <div className="mb-4 inline-flex rounded-lg bg-indigo-500/10 p-3">
                <Eye className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Real-time Monitoring</h3>
              <p className="text-slate-400">
                Continuous transaction surveillance with instant risk scoring and automated flagging of suspicious activity.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 backdrop-blur">
              <div className="mb-4 inline-flex rounded-lg bg-purple-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">ML-Powered Analytics</h3>
              <p className="text-slate-400">
                Advanced machine learning models trained on millions of transactions to detect emerging fraud patterns.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 backdrop-blur">
              <div className="mb-4 inline-flex rounded-lg bg-red-500/10 p-3">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Instant Alerts</h3>
              <p className="text-slate-400">
                Get immediate notifications for high-risk transactions with detailed risk factors and explanations.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 backdrop-blur">
              <div className="mb-4 inline-flex rounded-lg bg-cyan-500/10 p-3">
                <Lock className="h-6 w-6 text-cyan-400" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Secure & Compliant</h3>
              <p className="text-slate-400">
                Enterprise-grade security with full audit trails and compliance reporting for regulatory requirements.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 backdrop-blur">
              <div className="mb-4 inline-flex rounded-lg bg-green-500/10 p-3">
                <Shield className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Risk Scoring</h3>
              <p className="text-slate-400">
                Intelligent risk assessment considering transaction patterns, amounts, devices, and behavioral factors.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-900/40 p-8 backdrop-blur">
              <div className="mb-4 inline-flex rounded-lg bg-amber-500/10 p-3">
                <Zap className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-white">Lightning Fast</h3>
              <p className="text-slate-400">
                Sub-50ms latency for fraud detection with minimal impact on transaction processing speed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/50 to-purple-950/50 p-12 text-center backdrop-blur">
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Ready to Secure Your Transactions?
          </h2>
          <p className="mb-8 text-lg text-slate-300">
            Join leading fintech companies using Fraudies to protect their customers
          </p>
          <Link 
            href="/register" 
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-indigo-500 hover:scale-105"
          >
            Get Started Free
            <Zap className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-indigo-500" />
              <span className="text-xl font-bold text-white">Fraudies</span>
            </div>
          </div>
          <div className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Fraudies. Enterprise Fraud Detection Platform.
          </div>
        </div>
      </footer>
    </main>
  );
}
