import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import AnimatedNumber from '../components/AnimatedNumber';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verified, _setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { register, login, error, isLoading, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const passwordRef = useRef('');
  const hasAutoResent = useRef(false);

  useEffect(() => {
    clearError();
    if (isAuthenticated || localStorage.getItem('auth_session')) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, clearError]);

  useEffect(() => {
    if (registeredEmail && !hasAutoResent.current) {
      hasAutoResent.current = true;
      handleResendOtp();
    }
  }, [registeredEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ name, email, password });
      passwordRef.current = password;
      setRegisteredEmail(email);
    } catch (err) {
      // Handled in store
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError('');
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      setOtpError('Please enter the full 6-digit code');
      return;
    }
    setVerifying(true);
    setOtpError('');
    try {
      await api.post('/auth/verify-email', { email: registeredEmail, otp: code });
      await login({ email: registeredEmail, password: passwordRef.current });
      navigate('/dashboard');
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Invalid or expired verification code');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setResentMessage('');
    try {
      await api.post('/auth/resend-verification', { email: registeredEmail });
      setResentMessage('A new code has been sent to your email.');
      setOtp(Array(6).fill(''));
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  if (registeredEmail) {
    if (verified) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-background font-body-lg text-on-surface px-6">
          <Card className="w-full max-w-md p-8 text-center shadow-[8px_8px_0px_0px_var(--shadow-color)]">
            <span className="material-symbols-outlined text-5xl text-green-600 mb-4">verified</span>
            <h2 className="font-headline-lg text-2xl font-bold mb-2">Email Verified</h2>
            <p className="font-body-sm text-sm text-on-surface-variant mb-8">Your account is active. You can now log in.</p>
            <Link
              to="/login"
              className="inline-block bg-primary text-on-primary font-bold px-8 py-3 border-2 border-primary shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-widest font-label-caps text-sm"
            >
              Proceed to Login
            </Link>
          </Card>
        </main>
      );
    }

    return (
      <main className="min-h-screen flex items-center justify-center bg-background font-body-lg text-on-surface px-6">
        <Card className="w-full max-w-md p-8 text-center shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <span className="material-symbols-outlined text-5xl text-primary mb-4">mail</span>
          <h2 className="font-headline-lg text-2xl font-bold mb-2">Check Your Email</h2>
          <p className="font-body-sm text-sm text-on-surface-variant mb-2">
            We sent a 6-digit verification code to <strong className="text-primary">{registeredEmail}</strong>.
          </p>
          <p className="font-body-sm text-sm text-on-surface-variant mb-6">Enter the code below to activate your account.</p>

          {otpError && (
            <div className="bg-error-container border-2 border-error p-3 text-sm font-bold text-on-error-container uppercase font-data-mono mb-6">
              {otpError}
            </div>
          )}

          {resentMessage && (
            <div className="bg-green-100 border-green-800 text-green-800 border-2 p-3 text-sm font-bold uppercase font-data-mono mb-6">
              {resentMessage}
            </div>
          )}

          <div className="flex justify-center gap-2 mb-8">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-12 h-14 text-center font-data-mono text-xl border-2 border-primary bg-background focus:shadow-[2px_2px_0px_0px_var(--shadow-color)] focus:outline-none transition-all"
              />
            ))}
          </div>

          <Button
            className="w-full h-14"
            onClick={handleVerifyOtp}
            disabled={verifying}
          >
            {verifying ? 'VERIFYING...' : 'VERIFY CODE'}
            <span className="material-symbols-outlined">verified</span>
          </Button>

          <div className="mt-6">
            <button
              onClick={handleResendOtp}
              disabled={resending}
              className="font-label-caps text-xs text-on-surface-variant hover:text-primary underline underline-offset-2 transition-colors"
            >
              {resending ? 'SENDING...' : "Didn't receive the code? Send again"}
            </button>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-background font-body-lg text-on-surface">
      {/* Left Side: Branding & Dashboard Mockup (same as Login) */}
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
                    <linearGradient id="mockGradReg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  {/* Grid lines */}
                  {[0, 1, 2, 3].map(i => (
                    <line key={`g-${i}`} x1="0" y1={30 + i * 30} x2="400" y2={30 + i * 30} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
                  ))}
                  {/* Area fill */}
                  <path d="M0,120 Q30,100 60,110 T120,80 T180,95 T240,50 T300,70 T360,30 L400,20 L400,150 L0,150 Z" fill="url(#mockGradReg)" opacity="0" style={{ animation: 'mockFadeIn 1.2s ease-out 0.6s forwards' }} />
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

      {/* Right Side: Register Form */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Branding */}
          <div className="md:hidden mb-8 text-center">
            <h1 className="font-display-lg text-4xl tracking-tighter uppercase text-primary">HELIX</h1>
            <p className="font-label-caps text-[10px] text-on-surface-variant">Preparation Intelligence</p>
          </div>

          <Card className="p-8">
            <div className="mb-8">
              <h2 className="font-headline-lg text-3xl font-bold mb-2">Create Account</h2>
              <p className="font-body-sm text-sm text-on-surface-variant">Register a new candidate profile to synchronize scanning.</p>
            </div>

            {error && (
              <div className="bg-error-container border-2 border-error p-3 text-sm font-bold text-on-error-container uppercase font-data-mono mb-6">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Full Name Field */}
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-primary block" htmlFor="name">FULL NAME</label>
                <input 
                  className="w-full h-12 px-4 bg-background border-2 border-primary focus:ring-0 focus:border-primary focus:shadow-[2px_2px_0px_0px_var(--shadow-color)] transition-all outline-none font-body-sm text-sm" 
                  id="name" 
                  name="name" 
                  placeholder="Operator Name" 
                  required 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

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
                <label className="font-label-caps text-[10px] text-primary block" htmlFor="password">PASSWORD</label>
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

              {/* Register Button */}
              <Button 
                className="w-full h-14" 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'CREATING...' : 'INITIALIZE PROTOCOL'}
                <span className="material-symbols-outlined">how_to_reg</span>
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="font-body-sm text-sm text-on-surface-variant">
                Already registered?{' '}
                <Link className="font-bold text-primary underline decoration-2 underline-offset-4 hover:text-secondary transition-colors" to="/login">
                  Login
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

export default Register;
