import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Card, CardContent } from '../ui/card.tsx';
import { Input } from '../ui/input.tsx';
import { Button } from '../ui/button.tsx';
import { Alert } from '../ui/alert.tsx';
import { Shield } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const result = await login(email, password);
        if (!result.success) {
          setError(result.error || 'Authentication failed');
        }
      } else {
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          setSubmitting(false);
          return;
        }
        const result = await register(email, password);
        if (!result.success) {
          setError(result.error || 'Registration failed');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreFillAdmin = () => {
    setEmail('lead_admin@netguard.local');
    setPassword('SecurePassword123!');
    setError(null);
  };

  const handlePreFillViewer = () => {
    setEmail('analyst_candidate@netguard.local');
    setPassword('ViewerPassword123!');
    setError(null);
  };

  const tab = (value: 'login' | 'register', label: string) => (
    <button
      type="button"
      onClick={() => {
        setMode(value);
        setError(null);
      }}
      aria-pressed={mode === value}
      className={`h-8 flex-1 cursor-pointer rounded-md text-body font-medium transition-colors ${
        mode === value ? 'bg-zinc-800 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'text-zinc-500 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="page-enter flex min-h-screen w-full items-center justify-center bg-zinc-950 p-4 text-zinc-100">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-zinc-100" strokeWidth={1.5} />
            <h1 className="text-[28px] font-medium leading-none text-zinc-100">NetGuard</h1>
          </div>
          <p className="text-body text-zinc-400">Snort alert triage and incident response</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex gap-1 rounded-lg border border-white/8 bg-zinc-950 p-1">
              {tab('login', 'Sign in')}
              {tab('register', 'Register')}
            </div>

            <p className="mb-6 mt-4 text-body text-zinc-400">
              {mode === 'login'
                ? 'Sign in with your operator credentials'
                : 'The first registered account becomes Admin. Later accounts start as Viewer'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="destructive">{error}</Alert>}

              <div className="space-y-2">
                <label htmlFor="auth-email" className="text-body text-zinc-300">Email</label>
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="analyst@netguard.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="auth-password" className="text-body text-zinc-300">Password</label>
                <Input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                />
                {mode === 'register' && <p className="text-xs text-zinc-500">At least 8 characters</p>}
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Please wait' : mode === 'login' ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            {/* Demo shortcuts */}
            <div className="mt-6 flex items-center justify-between border-t border-white/8 pt-4 text-xs text-zinc-500">
              <span>Demo accounts</span>
              <div className="flex items-center gap-4">
                <button type="button" onClick={handlePreFillAdmin} className="cursor-pointer text-zinc-300 transition-colors hover:text-zinc-100">
                  Admin
                </button>
                <button type="button" onClick={handlePreFillViewer} className="cursor-pointer text-zinc-300 transition-colors hover:text-zinc-100">
                  Viewer / analyst
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
