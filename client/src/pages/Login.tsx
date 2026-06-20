import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import AnimatedNumber from '../components/AnimatedNumber';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, error, isLoading, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    if (isAuthenticated || localStorage.getItem('auth_session')) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, clearError]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (!window.google?.accounts?.oauth2) {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
    }
  }, []);

  const handleGoogleLogin = () => {
    if (!window.google?.accounts?.oauth2) return;
    setGoogleLoading(true);
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: async (response: { access_token?: string; error?: string }) => {
        if (!response.access_token) {
          setGoogleLoading(false);
          return;
        }
        try {
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` },
          });
          const userInfo = await userInfoRes.json();
          const res = await api.post('/auth/google', {
            email: userInfo.email,
            name: userInfo.name,
            avatar: userInfo.picture,
            googleId: userInfo.sub,
          });
          const user = res.data;
          localStorage.setItem('auth_session', JSON.stringify(user));
          window.dispatchEvent(new Event('auth_session_updated'));
          navigate('/dashboard');
        } catch {
          setGoogleLoading(false);
        }
      },
    });
    client.requestAccessToken();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnverifiedEmail('');
    setResentMessage('');
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 403) {
        setUnverifiedEmail(email);
      }
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResentMessage('');
    try {
      await api.post('/auth/resend-verification', { email: unverifiedEmail });
      setResentMessage('Verification code resent. Check your inbox.');
    } catch {
      setResentMessage('Failed to resend. Try again later or contact support.');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-background font-body-lg text-on-surface">
      {/* Left Side: Branding & Dashboard Mockup */}
      <section className="hidden md:flex flex-1 flex-col justify-between p-margin-desktop bg-primary text-on-primary relative overflow-hidden">
        <div>
          <h1 className="font-display-lg text-5xl font-extrabold tracking-tighter uppercase text-on-primary">HELIX</h1>
          <p className="font-headline-md text-xl mt-1 text-on-primary max-w-md">
            High-Performance Prep Intelligence. Data density without the noise.
          </p>
        </div>

        {/* Dashboard Preview Mockup (Bento Style) */}
        <div className="relative mt-8 z-10 w-full max-w-4xl self-center">
          <div className="grid grid-cols-4 grid-rows-3 gap-4 p-4 border-2 border-white/20 bg-background/10 backdrop-blur-sm rounded-lg">
            {/* Stat Card 1 */}
            <div className="col-span-2 row-span-1 bg-background border-2 border-primary p-4 shadow-[4px_4px_0px_0px_var(--shadow-color)] text-primary">
              <span className="font-label-caps text-[10px] text-primary block mb-2">FAILURE INTELLIGENCE</span>
              <div className="h-24 w-full flex items-end gap-1">
                <div className="bg-secondary w-full animate-bar-grow" style={{ '--bar-h': '40%', animationDelay: '0.1s' } as React.CSSProperties}></div>
                <div className="bg-secondary w-full animate-bar-grow" style={{ '--bar-h': '65%', animationDelay: '0.2s' } as React.CSSProperties}></div>
                <div className="bg-secondary w-full animate-bar-grow" style={{ '--bar-h': '45%', animationDelay: '0.3s' } as React.CSSProperties}></div>
                <div className="bg-secondary w-full animate-bar-grow" style={{ '--bar-h': '90%', animationDelay: '0.4s' } as React.CSSProperties}></div>
                <div className="bg-secondary w-full animate-bar-grow" style={{ '--bar-h': '55%', animationDelay: '0.5s' } as React.CSSProperties}></div>
              </div>
            </div>
            {/* Stat Card 2 */}
            <div className="col-span-2 row-span-1 bg-secondary-container border-2 border-primary p-4 shadow-[4px_4px_0px_0px_var(--shadow-color)] text-on-secondary-container">
              <span className="font-label-caps text-[10px] text-on-secondary-container block mb-2">RISK SCORE</span>
              <div className="font-display-lg text-4xl font-black text-primary"><AnimatedNumber value={0.082} decimals={3} duration={1500} /></div>
              <span className="font-data-mono text-xs text-secondary font-bold block mt-2">CRITICAL SCAN: PASS</span>
            </div>
            {/* Large Data Visualization Area */}
            <div className="col-span-4 row-span-2 bg-background border-2 border-primary p-6 shadow-[4px_4px_0px_0px_var(--shadow-color)] relative overflow-hidden text-primary">
              <span className="font-label-caps text-[10px] text-primary block mb-4">SYSTEM THROUGHPUT</span>
              <div className="w-full h-44 bg-surface-container border-2 border-primary relative overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="mockGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[0, 1, 2, 3].map(i => (
                    <line key={`g-${i}`} x1="0" y1={30 + i * 30} x2="400" y2={30 + i * 30} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
                  ))}
                  {/* Area fill */}
                  <path d="M0,120 Q30,100 60,110 T120,80 T180,95 T240,50 T300,70 T360,30 L400,20 L400,150 L0,150 Z" fill="url(#mockGrad)" opacity="0" style={{ animation: 'mockFadeIn 1.2s ease-out 0.6s forwards' }} />
                  {/* Line */}
                  <path d="M0,120 Q30,100 60,110 T120,80 T180,95 T240,50 T300,70 T360,30 L400,20" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" strokeDasharray="600" strokeDashoffset="600" style={{ animation: 'mockDraw 1.5s ease-out forwards' }} />
                  {/* Data dots */}
                  {[
                    [60, 110], [120, 80], [180, 95], [240, 50], [300, 70], [360, 30]
                  ].map(([cx, cy], i) => (
                    <circle key={`dot-${i}`} cx={cx} cy={cy} r="0" fill="white" stroke="currentColor" strokeWidth="1.5" opacity="0.8" style={{ animation: 'mockDotPop 0.3s ease-out forwards', animationDelay: `${0.8 + i * 0.15}s` }} />
                  ))}
                </svg>
                {/* Corner label */}
                <span className="absolute bottom-2 right-3 font-data-mono text-[7px] text-on-surface-variant/40 uppercase tracking-widest">REAL-TIME</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="font-data-mono text-xs text-on-primary/50">© 2026 HELIX PREPARATION INTELLIGENCE. VER 2.4.1</p>
        </div>
      </section>

      {/* Right Side: Login Form */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Branding */}
          <div className="md:hidden mb-8 text-center">
            <h1 className="font-display-lg text-4xl tracking-tighter uppercase text-primary">HELIX</h1>
            <p className="font-label-caps text-[10px] text-on-surface-variant">Preparation Intelligence</p>
          </div>

          <Card className="p-8">
            <div className="mb-8">
              <h2 className="font-headline-lg text-3xl font-bold mb-2">Access Portal</h2>
              <p className="font-body-sm text-sm text-on-surface-variant">Enter credentials to synchronize dashboard session.</p>
            </div>

            {error && (
              <div className="bg-error-container border-2 border-error p-3 text-sm font-bold text-on-error-container uppercase font-data-mono mb-6">
                {error}
              </div>
            )}

            {unverifiedEmail && (
              <div className="bg-secondary-container text-on-secondary-container border-2 border-primary p-4 mb-6 text-sm">
                <p className="font-bold mb-2">Email not verified yet.</p>
                <p className="text-xs text-on-surface-variant mb-3">
                  Check your inbox (and spam folder) for a 6-digit verification code, or click below to resend.
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="bg-primary text-on-primary font-bold px-4 py-2 border-2 border-primary text-xs uppercase tracking-wider hover:opacity-90 transition-all"
                >
                  {resending ? 'SENDING...' : 'RESEND VERIFICATION CODE'}
                </button>
                {resentMessage && (
                  <p className="text-xs text-on-surface-variant mt-2">{resentMessage}</p>
                )}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-primary block" htmlFor="email">EMAIL ADDRESS</label>
                <input 
                  className="w-full h-12 px-4 bg-background border-2 border-primary focus:ring-0 focus:border-primary focus:shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all outline-none font-body-sm text-sm" 
                  id="email" 
                  name="email" 
                  placeholder="operator@helix.ai" 
                  required 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-label-caps text-[10px] text-primary block" htmlFor="password">PASSWORD</label>
                  <a className="font-label-caps text-[10px] text-on-tertiary-container hover:text-primary transition-colors" href="#">FORGOT?</a>
                </div>
                <input 
                  className="w-full h-12 px-4 bg-background border-2 border-primary focus:ring-0 focus:border-primary focus:shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all outline-none font-body-sm text-sm" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Login Button */}
              <Button 
                className="w-full h-14" 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'VERIFYING...' : 'AUTHENTICATE SESSION'}
                <span className="material-symbols-outlined">login</span>
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 border-t border-primary/20"></div>
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">or</span>
              <div className="flex-1 border-t border-primary/20"></div>
            </div>

            {/* Google Sign-In */}
            {GOOGLE_CLIENT_ID ? (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full h-12 flex items-center justify-center gap-3 bg-white text-primary border-2 border-primary font-label-caps text-xs uppercase tracking-wider font-bold shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
              >
                <svg viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 000 24c0 3.77.87 7.35 2.56 10.56l7.98-5.97z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.97C6.51 42.62 14.62 48 24 48z" />
                </svg>
                {googleLoading ? 'Connecting...' : 'Continue with Google'}
              </button>
            ) : (
              <div className="border-2 border-dashed border-primary p-3 text-center">
                <p className="font-label-caps text-[9px] text-on-surface-variant uppercase">
                  Google sign-in not configured. Set VITE_GOOGLE_CLIENT_ID in client .env
                </p>
              </div>
            )}

            {/* Footer Link */}
            <div className="mt-6 text-center">
              <p className="font-body-sm text-sm text-on-surface-variant">
                Don't have an account?{' '}
                <Link className="font-bold text-primary underline decoration-2 underline-offset-4 hover:text-secondary transition-colors" to="/register">
                  Register
                </Link>
              </p>
            </div>
          </Card>

          {/* Compliance Info */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link className="font-label-caps text-[10px] text-on-tertiary-container hover:text-primary" to="/security">SECURITY PROTOCOLS</Link>
            <Link className="font-label-caps text-[10px] text-on-tertiary-container hover:text-primary" to="/privacy">PRIVACY POLICY</Link>
            <a className="font-label-caps text-[10px] text-on-tertiary-container hover:text-primary" href="#">SYSTEM STATUS</a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
