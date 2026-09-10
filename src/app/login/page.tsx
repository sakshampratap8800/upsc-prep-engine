'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/');
        router.refresh(); // Force a refresh to ensure middleware catches the new cookie globally
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] dark:bg-black relative overflow-hidden font-sans">
      {/* Liquid background decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 blur-3xl opacity-50 pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-emerald-400/30 to-cyan-400/30 blur-3xl opacity-50 pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-[380px] p-8 mx-4">
        <div className="absolute inset-0 bg-white/40 dark:bg-white/5 backdrop-blur-2xl rounded-[32px] shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_0_rgba(255,255,255,0.02)] border border-white/50 dark:border-white/10" />
        
        <div className="relative z-20 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 shadow-xl flex items-center justify-center mb-6 border border-white/20">
            <Lock className="w-8 h-8 text-white/90" strokeWidth={1.5} />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-white mb-2">
            Sign In
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mb-8 text-center px-4">
            UPSC Preparation Engine
          </p>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="space-y-3">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-blue-500 transition-colors">
                  <User className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-black/20 border border-stone-200 dark:border-stone-800 rounded-2xl text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all backdrop-blur-md text-[15px]"
                  placeholder="Username"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-white/50 dark:bg-black/20 border border-stone-200 dark:border-stone-800 rounded-2xl text-stone-900 dark:text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all backdrop-blur-md text-[15px]"
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center font-medium bg-red-50 dark:bg-red-950/30 py-2 rounded-xl border border-red-100 dark:border-red-900/50 animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 px-4 bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-200 text-white dark:text-stone-900 rounded-2xl font-medium text-[15px] shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 overflow-hidden mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Continue'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
