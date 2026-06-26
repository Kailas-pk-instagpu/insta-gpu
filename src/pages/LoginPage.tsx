import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gamepad2, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import GPUBackground from '@/features/login/GPUBackground';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const result = login(email, password);
      setLoading(false);
      if (!result.success) {
        setError(result.error || 'Login failed');
        return;
      }
      if (result.requires2FA) navigate('/verify-2fa');
      else navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <GPUBackground />

      <div
        className="relative z-20 w-full max-w-md animate-login-up"
        style={{ animationDelay: '120ms' }}
      >
        {/* Glow ring behind card */}
        <div
          aria-hidden
          className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/40 via-transparent to-[hsl(var(--gradient-end))]/40 blur-md opacity-60"
        />

        <div className="relative rounded-2xl border border-white/10 bg-[hsl(var(--card)/0.55)] backdrop-blur-2xl shadow-[0_30px_80px_-20px_hsl(var(--primary)/0.35)] p-8 sm:p-10">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8 animate-login-up" style={{ animationDelay: '220ms' }}>
            <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/40">
              <Gamepad2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">GPU Cloud</p>
              <p className="text-xs text-muted-foreground">Beyond Hardware</p>
            </div>
          </div>

          <div className="mb-7 animate-login-up" style={{ animationDelay: '300ms' }}>
            <h1 className="text-3xl sm:text-[2rem] font-bold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Sign in to continue to your gaming command center.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-login-in">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2 animate-login-up" style={{ animationDelay: '380ms' }}>
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@gpucloud.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-background/40 border-white/10 focus-visible:ring-primary/60 transition-all"
              />
            </div>

            <div className="space-y-2 animate-login-up" style={{ animationDelay: '460ms' }}>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Password
                </Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10 bg-background/40 border-white/10 focus-visible:ring-primary/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="animate-login-up" style={{ animationDelay: '540ms' }}>
              <Button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full h-12 gradient-primary text-primary-foreground text-sm font-semibold rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Log in'
                )}
              </Button>
            </div>

            <div
              className="mt-5 p-3 rounded-lg bg-background/40 border border-white/10 text-xs text-muted-foreground space-y-0.5 animate-login-in"
              style={{ animationDelay: '780ms' }}
            >
              <p className="font-medium text-foreground text-xs mb-1.5">Demo accounts</p>
              <p className="font-mono text-[11px]">superadmin@gpucloud.io</p>
              <p className="font-mono text-[11px]">admin@gpucloud.io · owner@gpucloud.io · manager@gpucloud.io</p>
              <p className="mt-1">Password: <span className="font-mono">admin123</span></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

