import Link from 'next/link';
import { ArrowRight, Shield, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 lg:px-16 bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700">
              <Sparkles className="h-4 w-4" /> Executive ConstructionTech for GCC
            </span>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Ardaca: Digital project control for developers, contractors, and government.</h1>
            <p className="max-w-2xl text-base leading-8 text-slate-700">
              Launch modern construction coordination, approvals, document workflows, and AI-ready project intelligence with a premium bilingual platform built for UAE and Saudi Arabia.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/dashboard" className="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-800">
                Explore the dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                Login for teams
              </Link>
            </div>
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-brand-900 to-brand-700 p-8 text-white shadow-soft">
            <div className="space-y-6">
              <div className="rounded-3xl bg-slate-900/80 p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Executive KPI</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-950/80 p-4">
                    <p className="text-2xl font-semibold">18</p>
                    <p className="text-sm text-slate-400">Active projects</p>
                  </div>
                  <div className="rounded-3xl bg-slate-950/80 p-4">
                    <p className="text-2xl font-semibold">34</p>
                    <p className="text-sm text-slate-400">Pending approvals</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm text-slate-200">Smart insights</p>
                  <p className="mt-3 text-xl font-semibold">Cost risk <span className="text-emerald-300">3%</span></p>
                </div>
                <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
                  <p className="text-sm text-slate-200">Timeline accuracy</p>
                  <p className="mt-3 text-xl font-semibold">92%</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
