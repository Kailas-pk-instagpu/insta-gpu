import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Verify2FAPage() {
  const navigate = useNavigate();
  const { verify2FA, user, isAuthenticated } = useAuthStore();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
    if (!user) navigate('/login');
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newCode.every(d => d !== '') && index === 5) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (fullCode?: string) => {
    const codeStr = fullCode || code.join('');
    if (codeStr.length !== 6) { setError('Please enter all 6 digits'); return; }
    setLoading(true);
    setTimeout(() => {
      const success = verify2FA(codeStr);
      setLoading(false);
      if (success) navigate('/dashboard');
      else setError('Invalid verification code. Try any 6 digits.');
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <ShieldCheck className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Two-Factor Authentication</CardTitle>
            <CardDescription className="mt-1">
              Enter the 6-digit code from your authenticator app
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-center gap-3">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-input bg-background focus:border-primary focus:ring-2 focus:ring-ring/20 outline-none transition-all"
              />
            ))}
          </div>

          <Button onClick={() => handleVerify()} className="w-full gradient-primary text-primary-foreground h-11" disabled={loading || code.join('').length !== 6}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            For demo, enter any 6 digits (e.g. 123456)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
