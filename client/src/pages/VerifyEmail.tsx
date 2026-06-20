import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';

export const VerifyEmail: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/resend-verification', { email });
      setStep('otp');
      setMessage('');
      setStatus('idle');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to send verification code');
      setStatus('error');
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setMessage('');
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
      setMessage('Please enter the full 6-digit code');
      return;
    }
    setStatus('verifying');
    setMessage('');
    try {
      const res = await api.post('/auth/verify-email', { email, otp: code });
      setStatus('success');
      setMessage(res.data.message || 'Email verified successfully!');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Invalid or expired verification code');
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setMessage('A new code has been sent.');
      setOtp(Array(6).fill(''));
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background font-body-lg text-on-surface px-6">
      <Card className="w-full max-w-md p-8 text-center shadow-[8px_8px_0px_0px_var(--shadow-color)]">
        {status === 'success' ? (
          <>
            <span className="material-symbols-outlined text-5xl text-green-600 mb-4">verified</span>
            <h2 className="font-headline-lg text-2xl font-bold mb-2">Email Verified</h2>
            <p className="font-body-sm text-sm text-on-surface-variant mb-8">{message}</p>
            <Link
              to="/login"
              className="inline-block bg-primary text-on-primary font-bold px-8 py-3 border-2 border-primary shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-widest font-label-caps text-sm"
            >
              Proceed to Login
            </Link>
          </>
        ) : step === 'email' ? (
          <>
            <span className="material-symbols-outlined text-5xl text-primary mb-4">mail</span>
            <h2 className="font-headline-lg text-2xl font-bold mb-2">Verify Your Email</h2>
            <p className="font-body-sm text-sm text-on-surface-variant mb-6">
              Enter the email address you registered with to receive a verification code.
            </p>
            {message && (
              <div className="bg-error-container border-2 border-error p-3 text-sm font-bold text-on-error-container uppercase font-data-mono mb-6">
                {message}
              </div>
            )}
            <form onSubmit={handleSendCode} className="space-y-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full h-12 px-4 bg-background border-2 border-primary focus:shadow-[2px_2px_0px_0px_var(--shadow-color)] focus:outline-none transition-all font-body-sm text-sm"
              />
              <button
                type="submit"
                className="w-full bg-primary text-on-primary font-bold py-3 border-2 border-primary shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest font-label-caps text-sm"
              >
                Send Verification Code
              </button>
            </form>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-5xl text-primary mb-4">pin</span>
            <h2 className="font-headline-lg text-2xl font-bold mb-2">Enter Verification Code</h2>
            <p className="font-body-sm text-sm text-on-surface-variant mb-6">
              We sent a 6-digit code to <strong className="text-primary">{email}</strong>.
            </p>
            {message && (
              <div className={`border-2 p-3 text-sm font-bold uppercase font-data-mono mb-6 ${
                status === 'error' ? 'bg-error-container border-error text-on-error-container' : 'bg-green-100 border-green-800 text-green-800'
              }`}>
                {message}
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
            <button
              onClick={handleVerifyOtp}
              disabled={status === 'verifying'}
              className="w-full bg-secondary-container text-on-secondary-container font-bold py-3 border-2 border-primary shadow-[4px_4px_0px_0px_var(--shadow-color)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest font-label-caps text-sm disabled:opacity-50"
            >
              {status === 'verifying' ? 'VERIFYING...' : 'VERIFY CODE'}
            </button>
            <div className="mt-6">
              <button
                onClick={handleResend}
                disabled={resending}
                className="font-label-caps text-xs text-on-surface-variant hover:text-primary underline underline-offset-2 transition-colors"
              >
                {resending ? 'SENDING...' : "Didn't receive the code? Send again"}
              </button>
            </div>
          </>
        )}
      </Card>
    </main>
  );
};

export default VerifyEmail;