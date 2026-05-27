'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Building2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, useToast } from '@/components';
import { register } from '@/lib/api';
import Link from 'next/link';

const countryCodes = [
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'QA', name: 'Qatar' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    organisationName: '',
    countryCode: 'AE',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please entergradient-to-br from-slate-50 to-slate-100 px-6 py-16">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Get Started</h1>
          <p className="mt-2 text-slate-600">Create your Ardaca account to begin managing projects</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
          </CardHeader>

          <form className="space-y-4" onSubmit={handleRegister}>
            <Input
              label="Full Name"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              leftIcon={<User className="h-4 w-4" />}
              error={errors.fullName}
              placeholder="John Doe"
              disabled={isLoading}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email}
              placeholder="you@company.com"
              disabled={isLoading}
              required
            />

            <Input
              label="Organisation Name"
              type="text"
              value={formData.organisationName}
              onChange={(e) => setFormData({ ...formData, organisationName: e.target.value })}
              leftIcon={<Building2 className="h-4 w-4" />}
              error={errors.organisationName}
              placeholder="Your Company"
              disabled={isLoading}
              required
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Country</label>
              <select
                value={formData.countryCode}
                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:opacity-50"
                disabled={isLoading}
              >
                {countryCodes.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password}
                placeholder="At least 8 characters"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-10 text-slate-400 hover:text-slate-600 transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button type="submit" fullWidth isLoading={isLoading} size="lg">
              {isLoading ? 'Creating account...' : 'Create Account'}
              {!isLoading && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="text-brand-700 font-semibold hover:text-brand-800">
              Sign in
            </Link>
          </div>
        </Card>

        <p className="mt-8 text-center text-xs text-slate-500">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </main>
  );
      addToast({
        title: 'Form validation failed',
        message: 'Please check your input',
        type: 'error',
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(formData);
      addToast({
        title: 'Account created',
        message: 'Welcome to Ardaca!',
        type: 'success',
        duration: 2000,
      });
      router.push('/dashboard');
    } catch (err) {
      addToast({
        title: 'Registration failed',
        message: 'An account with this email may already exist',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 sm:px-10 lg:px-20">
      <section className="mx-auto max-w-2xl rounded-[2rem] bg-white p-10 shadow-soft">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-700">Launch your organisation</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Create your Ardaca tenant</h1>
          <p className="mt-2 text-slate-600">Register your team and begin managing construction projects with real-time collaboration.</p>
        </div>
        <form className="grid gap-5" onSubmit={handleRegister}>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email address
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Organisation name
              <input
                type="text"
                value={organisationName}
                onChange={(event) => setOrganisationName(event.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Country code
              <input
                type="text"
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value.toUpperCase())}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <button className="inline-flex items-center justify-center rounded-2xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
            Register now
          </button>
        </form>
      </section>
    </main>
  );
}
