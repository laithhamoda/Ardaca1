'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { ArrowRight, TrendingUp, AlertCircle } from 'lucide-react';
import { Header, Sidebar, Stat, Card, CardHeader, CardTitle, Button, Skeleton, useToast } from '@/components';
import { getDashboardData, logout } from '@/lib/api';
import Link from 'next/link';

interface DashboardData {
  activeProjects: number;
  pendingApprovals: number;
  documents: number;
  teamMembers: number;
  notifications: Array<{ id: string; title: string; message: string; read: boolean }>;
  insights: Array<{ title: string; highlight: string; summary: string }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    getDashboardData()
      .then((result) => {
        setData(result);
        addToast({
          title: 'Dashboard loaded',
          type: 'success',
          duration: 2000,
        });
      })
      .catch(() => {
        setError('Unable to load dashboard data. Please try again.');
        addToast({
          title: 'Failed to load dashboard',
          message: 'There was an error loading your data.',
          type: 'error',
        });
      });
  }, [addToast]);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <Header title="Dashboard" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="px-6 py-8 lg:px-16">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Executive Dashboard</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">Project control in one intelligent hub</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Manage multi-tenant workflows, approvals, document versioning, and stakeholder notifications from a single enterprise console.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-rose-900">{error}</p>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-4">
            <Stat
              label="Active projects"
              value={data?.activeProjects ?? '—'}
              sublabel="Projects with live schedules and teams"
              isLoading={!data}
            />
            <Stat
              label="Pending approvals"
              value={data?.pendingApprovals ?? '—'}
              sublabel="Approval workflows requiring attention"
              isLoading={!data}
            />
            <Stat
              label="Documents"
              value={data?.documents ?? '—'}
              sublabel="All active file versions and archives"
              isLoading={!data}
            />
            <Stat
              label="Team members"
              value={data?.teamMembers ?? '—'}
              sublabel="Collaborators across projects"
              isLoading={!data}
            />
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Risk overview</p>
                    <CardTitle>AI insights and smart recommendations</CardTitle>
                  </div>
                  <TrendingUp className="h-8 w-8 text-brand-700" />
                </div>
              </CardHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                {!data ? (
                  <>
                    <Skeleton height={120} />
                    <Skeleton height={120} />
                  </>
                ) : (
                  data.insights.map((insight) => (
                    <div key={insight.title} className="rounded-xl border border-slate-200 p-4 hover:shadow-sm transition">
                      <p className="text-sm font-semibold text-slate-900">{insight.title}</p>
                      <p className="mt-2 text-xl font-semibold text-brand-700">{insight.highlight}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{insight.summary}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <div className="space-y-6">
              <Card variant="gradient">
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">Audit summary</p>
                <p className="mt-4 text-3xl font-semibold">Secure compliance ready</p>
                <p className="mt-3 text-sm leading-6 text-cyan-100">
                  Track every action across approvals, project updates, and document version history in a centralized audit trail.
                </p>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500 font-semibold">Recent notifications</p>
                  <Link href="/notifications" className="text-sm text-brand-700 hover:text-brand-800 font-medium">
                    View all
                  </Link>
                </div>
                <div className="space-y-3">
                  {!data ? (
                    <>
                      <Skeleton height={60} />
                      <Skeleton height={60} />
                    </>
                  ) : data.notifications.length > 0 ? (
                    data.notifications.slice(0, 3).map((notification) => (
                      <div key={notification.id} className="rounded-lg border border-slate-200 p-3 hover:bg-slate-50 transition">
                        <p className="font-semibold text-sm text-slate-900">{notification.title}</p>
                        <p className="text-sm text-slate-600">{notification.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="mt-8 rounded-3xl bg-white p-8 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Project pipeline</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">High-value project scorecards</h2>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-brand-700 hover:text-brand-800">
            Explore projects
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Current delivery rate</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">88%</p>
          </div>
          <div className="rounded-3xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">On-time approvals</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">76%</p>
          </div>
          <div className="rounded-3xl border border-slate-200 p-5">
            <p className="text-sm text-slate-500">Contractor compliance</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">95%</p>
          </div>
        </div>
      </section>
    </main>
  );
}
