'use client';

import Link from "next/link";
import { Shield, Activity, Brain, Clock, DollarSign, Users, CheckCircle2, ArrowRight, TrendingDown, Lock, AlertCircle } from "lucide-react";
import { AnimatedStat } from "@/components/landing/AnimatedStat";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <span className="text-xl font-bold text-white">Fraudies</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-white/60 transition-colors hover:text-white">
              Dashboard
            </Link>
            <Link href="/login" className="text-sm font-medium text-white/60 transition-colors hover:text-white">
              Login
            </Link>
            <Link href="/register" className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black transition-all hover:bg-emerald-400">
              Start Free Trial
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-32 pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.1)_0%,_transparent_50%)]" />
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-400 uppercase tracking-wider">
                PAYMENT FRAUD DETECTION
              </div>
              <h1 className="mb-6 text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
                Catch payment fraud
                <br />
                <span className="text-white/40">before</span> the chargeback
              </h1>
              <p className="mb-8 text-lg text-white/60 leading-relaxed max-w-xl">
                Stop losing 2-5% of revenue to friendly fraud, account takeovers, and synthetic identities. 
                Flag suspicious transactions in under 50ms—before they hit your payment processor.
              </p>
              
              {/* Value props */}
              <div className="mb-10 space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-white/80">Reduce chargebacks by 73% on average</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-white/80">Deploy in 4 hours with REST API</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  <span className="text-white/80">No upfront ML training required</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/register" 
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-6 py-3.5 text-base font-semibold text-black transition-all hover:bg-emerald-400"
                >
                  Start 14-day free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3.5 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/10"
                >
                  View live demo
                </Link>
              </div>
              
              <p className="mt-6 text-xs text-white/40">
                Used by payment platforms processing $2B+ annually
              </p>
            </div>

            {/* Right: Product Preview */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full opacity-20" />
              
              <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-white/80">Live Transaction Feed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-white/40">Real-time</span>
                  </div>
                </div>
                
                {/* Transaction cards */}
                <div className="space-y-3">
                  {[
                    { amount: '$2,450.00', type: 'Card Purchase', risk: 92, status: 'FLAGGED', reason: 'Velocity check: 8 txns in 3min', time: '2s ago' },
                    { amount: '$89.99', type: 'Subscription', risk: 8, status: 'APPROVED', reason: 'Normal pattern', time: '5s ago' },
                    { amount: '$15,200.00', type: 'Wire Transfer', risk: 78, status: 'REVIEW', reason: 'New device + high amount', time: '12s ago' },
                  ].map((txn, i) => (
                    <div 
                      key={i} 
                      className="rounded-lg border border-white/10 bg-black/40 p-4 backdrop-blur transition-all hover:border-white/20 hover:bg-black/60"
                      style={{ 
                        animation: `fadeInUp 0.5s ease-out ${i * 0.1}s backwards`
                      }}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-semibold text-white">{txn.amount}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          txn.status === 'FLAGGED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          txn.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {txn.status}
                        </span>
                      </div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-white/40">{txn.type}</span>
                        <span className="text-xs text-white/30">{txn.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/60">{txn.reason}</span>
                        <span className="text-xs font-medium text-white/80">Risk: {txn.risk}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mini stats at bottom */}
                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-emerald-500">156</div>
                    <div className="text-xs text-white/40">Flagged today</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">2.4K</div>
                    <div className="text-xs text-white/40">Processed</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">47ms</div>
                    <div className="text-xs text-white/40">Avg latency</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats */}
      <section className="border-y border-white/10 bg-white/[0.02] px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <AnimatedStat value="$847M" label="Fraud prevented (2025)" />
            <AnimatedStat value="73" suffix="%" label="Avg. chargeback reduction" />
            <AnimatedStat value="47" suffix="ms" label="P95 detection latency" />
            <AnimatedStat value="0.3" suffix="%" label="False positive rate" />
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="px-6 py-16 bg-black">
        <div className="mx-auto max-w-6xl">
          <p className="mb-8 text-center text-sm text-white/40 uppercase tracking-wider">
            Protecting transactions for
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {['PayFlow', 'NeoBank', 'LendTech', 'FinanceHub'].map((company, i) => (
              <div key={i} className="flex items-center justify-center">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] px-6 py-4 text-center">
                  <span className="text-lg font-semibold text-white/60">{company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-emerald-500">THE COST OF DOING NOTHING</p>
          <h2 className="mb-16 text-4xl md:text-5xl font-bold leading-tight">
            Payment fraud is bleeding your business dry
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
              <TrendingDown className="mx-auto mb-4 h-10 w-10 text-red-400" />
              <div className="mb-2 text-3xl font-bold text-red-400">$32B</div>
              <p className="text-sm text-white/60">Lost to payment fraud in 2024 (US fintech alone)</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
              <DollarSign className="mx-auto mb-4 h-10 w-10 text-red-400" />
              <div className="mb-2 text-3xl font-bold text-red-400">$3.75</div>
              <p className="text-sm text-white/60">Cost per $1 of fraud (fees + operations + reputation)</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
              <Clock className="mx-auto mb-4 h-10 w-10 text-red-400" />
              <div className="mb-2 text-3xl font-bold text-red-400">45 days</div>
              <p className="text-sm text-white/60">Avg. time to detect sophisticated fraud patterns manually</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white/[0.02] px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-center text-sm font-medium uppercase tracking-wider text-emerald-500">HOW IT WORKS</p>
          <h2 className="mb-4 text-center text-4xl md:text-5xl font-bold">
            Detection in three layers
          </h2>
          <p className="mb-16 text-center text-lg text-white/60">
            Every transaction goes through velocity checks, behavioral analysis, and ML risk scoring
          </p>

          <div className="space-y-8">
            {[
              {
                step: '1',
                title: 'Velocity & Rules Engine',
                desc: 'Flag obvious patterns: 10 transactions in 2 minutes, card-not-present from high-risk country, email domain mismatch.',
                icon: Activity,
                color: 'emerald'
              },
              {
                step: '2',
                title: 'Behavioral Anomaly Detection',
                desc: 'Compare to user history: first international purchase, 4x normal order value, new shipping address, device fingerprint change.',
                icon: Brain,
                color: 'emerald'
              },
              {
                step: '3',
                title: 'ML Risk Score',
                desc: 'Gradient-boosted model trained on 50M+ labeled transactions outputs 0-100 risk score with feature explanations (SHAP values).',
                icon: Shield,
                color: 'emerald'
              }
            ].map((item, i) => (
              <div key={i} className="flex flex-col md:flex-row gap-6 items-start rounded-xl border border-white/10 bg-black/40 p-8">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <item.icon className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                      {item.step}
                    </span>
                    <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                  </div>
                  <p className="text-white/60">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specific Use Cases */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-center text-sm font-medium uppercase tracking-wider text-emerald-500">FRAUD TYPES WE CATCH</p>
          <h2 className="mb-16 text-center text-4xl md:text-5xl font-bold">
            Built for payment platforms & neobanks
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Account Takeover (ATO)',
                desc: 'Detects credential stuffing, session hijacking, SIM swaps',
                signals: ['Login from new device', 'Geo-impossible travel', 'Behavioral anomaly'],
                icon: Lock
              },
              {
                title: 'Friendly Fraud / Chargeback Abuse',
                desc: 'Flags customers with history of disputed legitimate purchases',
                signals: ['Multiple past chargebacks', 'High-value goods', 'Digital delivery'],
                icon: AlertCircle
              },
              {
                title: 'Synthetic Identity Fraud',
                desc: 'Catches fabricated identities before they accumulate credit',
                signals: ['No credit history', 'Recent SSN issuance', 'PO Box address'],
                icon: Users
              },
              {
                title: 'Card Testing & BIN Attacks',
                desc: 'Stops automated scripts testing stolen card numbers',
                signals: ['Rapid small transactions', 'Sequential card numbers', 'High decline rate'],
                icon: Activity
              }
            ].map((useCase, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-6">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                  <useCase.icon className="h-5 w-5 text-emerald-500" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">{useCase.title}</h3>
                <p className="mb-4 text-sm text-white/60">{useCase.desc}</p>
                <div className="space-y-2">
                  {useCase.signals.map((signal, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-emerald-500" />
                      <span className="text-xs text-white/50">{signal}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration */}
      <section className="bg-white/[0.02] px-6 py-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-emerald-500">DEVELOPER-FIRST</p>
          <h2 className="mb-6 text-4xl md:text-5xl font-bold">
            Deploy in hours, not months
          </h2>
          <p className="mb-12 text-lg text-white/60">
            Single REST API. Webhook callbacks. No model training required.
          </p>

          <div className="rounded-xl border border-white/10 bg-black p-6 text-left">
            <pre className="overflow-x-auto text-sm">
              <code className="text-emerald-400">{`POST /api/v1/transactions
Authorization: Bearer sk_live_...
Content-Type: application/json

{
  "amount": 129.99,
  "type": "PURCHASE",
  "userId": "usr_abc123",
  "ipAddress": "192.168.1.1",
  "deviceId": "dev_xyz789"
}

// Response (47ms)
{
  "id": "txn_def456",
  "status": "FLAGGED",
  "riskScore": 0.87,
  "riskFactors": [
    "Velocity: 5 transactions in 8 minutes",
    "New device fingerprint",
    "Amount 3.2x user average"
  ]
}`}</code>
            </pre>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="mb-2 text-2xl font-bold text-white">4 hours</div>
              <div className="text-sm text-white/50">Average integration time</div>
            </div>
            <div>
              <div className="mb-2 text-2xl font-bold text-white">REST + Webhooks</div>
              <div className="text-sm text-white/50">Standard protocols</div>
            </div>
            <div>
              <div className="mb-2 text-2xl font-bold text-white">SDKs</div>
              <div className="text-sm text-white/50">Node.js, Python, Java, Go</div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-center text-sm font-medium uppercase tracking-wider text-emerald-500">WHY FRAUDIES</p>
          <h2 className="mb-16 text-center text-4xl md:text-5xl font-bold">
            Built different
          </h2>
          
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-4 text-left text-sm font-medium text-white/60">Feature</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-emerald-500">Fraudies</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-white/40">Legacy Vendors</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-white/40">In-house Build</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {[
                  { feature: 'Time to deploy', fraudies: '4 hours', legacy: '6-8 weeks', inhouse: '4-6 months' },
                  { feature: 'API response time', fraudies: '<50ms', legacy: '200-500ms', inhouse: 'Varies' },
                  { feature: 'False positive rate', fraudies: '0.3%', legacy: '3-8%', inhouse: '10%+' },
                  { feature: 'Model training required', fraudies: 'No', legacy: 'Yes (60 days)', inhouse: 'Yes (ongoing)' },
                  { feature: 'Monthly cost (at scale)', fraudies: '$2,500', legacy: '$15K-50K', inhouse: '$80K+ eng cost' },
                  { feature: 'Explainable decisions', fraudies: 'Yes (SHAP)', legacy: 'Limited', inhouse: 'If built' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm text-white/80">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        {row.fraudies}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-white/40">{row.legacy}</td>
                    <td className="px-6 py-4 text-center text-sm text-white/40">{row.inhouse}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-center text-sm font-medium uppercase tracking-wider text-emerald-500">TRUSTED BY FINTECH LEADERS</p>
          <h2 className="mb-16 text-center text-4xl md:text-5xl font-bold">
            Real results from real companies
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "Fraudies caught a synthetic identity ring that would have cost us $380K. The ML explanations helped us understand the fraud pattern and update our KYC process.",
                author: "Sarah Chen",
                role: "VP Risk",
                company: "PayFlow (Series B)",
                metric: "91% chargeback reduction"
              },
              {
                quote: "We integrated in 6 hours. First week prevented $47K in friendly fraud. The webhook integration was cleaner than Stripe's documentation.",
                author: "Marcus Johnson",
                role: "CTO",
                company: "NeoBank (Seed)",
                metric: "6 hour integration"
              },
              {
                quote: "False positive rate dropped from 12% to 0.4%. Our ops team went from reviewing 2,000 alerts/day to 80. Massive efficiency gain.",
                author: "Priya Sharma",
                role: "Head of Fraud Ops",
                company: "LendTech (Series C)",
                metric: "0.4% false positives"
              }
            ].map((testimonial, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-6 flex flex-col">
                <p className="mb-6 text-sm text-white/70 leading-relaxed flex-1">"{testimonial.quote}"</p>
                <div className="border-t border-white/10 pt-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-500">
                      {testimonial.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{testimonial.author}</div>
                      <div className="text-xs text-white/50">{testimonial.role}, {testimonial.company}</div>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {testimonial.metric}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-12 text-center">
          <h2 className="mb-4 text-3xl md:text-4xl font-bold">
            Pay for itself in week one
          </h2>
          <p className="mb-8 text-lg text-white/70">
            If you're processing $1M+/month, you're likely losing $20-50K to fraud. 
            Our $2,500/month plan typically prevents $150K+ in fraud losses.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="rounded-lg border border-white/10 bg-black/40 p-6">
              <div className="mb-2 text-sm text-white/50">WITHOUT FRAUDIES</div>
              <div className="text-3xl font-bold text-red-400">-$38,000</div>
              <div className="mt-2 text-sm text-white/60">Monthly fraud losses</div>
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-6">
              <div className="mb-2 text-sm text-emerald-500/80">WITH FRAUDIES</div>
              <div className="text-3xl font-bold text-emerald-400">-$10,250</div>
              <div className="mt-2 text-sm text-white/60">$2,500 subscription + $7,750 fraud</div>
            </div>
          </div>
          <Link 
            href="/register" 
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-8 py-4 text-lg font-semibold text-black transition-all hover:bg-emerald-400"
          >
            Calculate your ROI
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-4xl md:text-5xl font-bold">
            Stop losing money to fraud
          </h2>
          <p className="mb-10 text-lg text-white/60">
            14-day free trial. No credit card required. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-8 py-4 text-lg font-semibold text-black transition-all hover:bg-emerald-400"
            >
              Start free trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-white backdrop-blur transition-all hover:bg-white/10"
            >
              See live demo
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white/[0.02] px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-4xl md:text-5xl font-bold">
            Common questions
          </h2>
          
          <div className="space-y-6">
            {[
              {
                q: "How long does integration take?",
                a: "Most teams integrate in 4-6 hours. We provide REST API endpoints, webhook handlers, and SDKs for Node.js, Python, Java, and Go. No ML training period required—our models work out of the box."
              },
              {
                q: "What's your false positive rate?",
                a: "Our average false positive rate is 0.3%, compared to 3-8% for legacy vendors. We achieve this through multi-layer detection (rules + behavioral + ML) and continuous model refinement based on your feedback."
              },
              {
                q: "Do you support real-time webhooks?",
                a: "Yes. Configure webhooks to receive instant notifications when transactions are flagged. Typical webhook delivery is under 100ms. We also support batch API calls for historical analysis."
              },
              {
                q: "What fraud types do you detect?",
                a: "We catch account takeover (ATO), friendly fraud/chargeback abuse, synthetic identity fraud, card testing, velocity attacks, and emerging patterns. Our ML models are trained on 50M+ labeled transactions."
              },
              {
                q: "How do you handle compliance?",
                a: "We're SOC 2 Type II certified, PCI DSS compliant, and GDPR ready. Full audit trails are maintained for all decisions. We provide compliance exports for regulatory reporting."
              },
              {
                q: "What if I need custom rules?",
                a: "You can configure custom velocity rules, blocklists, and thresholds via dashboard or API. Our ML models adapt to your specific transaction patterns within the first 30 days."
              }
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-black/40 p-6">
                <h3 className="mb-3 text-lg font-semibold text-white">{faq.q}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/[0.02] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Shield className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="text-xl font-bold text-white">Fraudies</span>
              </div>
              <p className="text-sm text-white/50">
                Real-time payment fraud detection for modern fintech platforms.
              </p>
            </div>
            
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Product</h3>
              <ul className="space-y-3">
                <li><Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">API Docs</Link></li>
                <li><Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Company</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="mb-4 text-sm font-semibold text-white uppercase tracking-wider">Legal</h3>
              <ul className="space-y-3">
                <li><Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">Security</Link></li>
                <li><Link href="#" className="text-sm text-white/60 hover:text-white transition-colors">Compliance</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-white/40">
                © {new Date().getFullYear()} Fraudies. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <span className="text-xs text-white/30">SOC 2 Type II Certified</span>
                <span className="text-xs text-white/30">PCI DSS Compliant</span>
                <span className="text-xs text-white/30">GDPR Ready</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
