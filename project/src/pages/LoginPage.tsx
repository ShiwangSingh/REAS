import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Phone, Shield, Zap } from 'lucide-react';
import { useUserStore } from '@/stores';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { GoogleLogin } from '@react-oauth/google';
import { CountrySelector } from '@/components/ui/country-selector';
import { COUNTRIES, Country } from '@/lib/countries';
import { toast } from 'sonner';

type Mode = 'email' | 'email-otp' | 'phone-otp';

export default function LoginPage() {
  const [mode, setMode]             = useState<Mode>('email');
  const [otpSent, setOtpSent]       = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [country, setCountry]       = useState<Country>(COUNTRIES[0]);
  const [otp, setOtp]               = useState('');
  const [inputError, setInputError] = useState('');
  const [isLoading, setIsLoading]   = useState(false);

  const { login, sendOTP, verifyOTP, isAuthenticated, loginWithGoogle } = useUserStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from      = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const reset = (m: Mode) => { setMode(m); setOtpSent(false); setOtp(''); setInputError(''); };

  const handleSubmit = async () => {
    setInputError('');
    setIsLoading(true);
    try {
      // ── Email / Password ──────────────────────────────────────
      if (mode === 'email') {
        if (!email.includes('@')) { setInputError('Enter a valid email address'); return; }
        await login(email);
        toast.success('Welcome back!');
        navigate(from, { replace: true });

      // ── Email OTP ─────────────────────────────────────────────
      } else if (mode === 'email-otp') {
        if (!otpSent) {
          if (!email.includes('@')) { setInputError('Enter a valid email address'); return; }
          await sendOTP({ email });
          setOtpSent(true);
          toast.success('OTP sent to your email inbox!', { duration: 7000 });
        } else {
          if (otp.length < 6) { setInputError('Enter the 6-digit OTP'); return; }
          await verifyOTP({ email, otp });
          toast.success('Login successful!');
          navigate(from, { replace: true });
        }

      // ── Phone OTP ─────────────────────────────────────────────
      } else {
        const identifier = `${country.dialCode}${phone}`.replace(/[\s-()]/g, '');
        if (!otpSent) {
          if (phone.length < 10) { setInputError('Enter a valid 10-digit mobile number'); return; }
          await sendOTP({ phone: identifier });
          setOtpSent(true);
          toast.success('OTP sent via SMS!', { duration: 7000 });
        } else {
          if (otp.length < 6) { setInputError('Enter the 6-digit OTP'); return; }
          await verifyOTP({ phone: identifier, otp });
          toast.success('Login successful!');
          navigate(from, { replace: true });
        }
      }
    } catch (err: any) {
      setInputError(err?.response?.data?.error || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── derived labels ─────────────────────────────────────────────────────────
  const btnLabel = () => {
    if (mode === 'email')     return 'Sign In';
    if (!otpSent)             return 'Send OTP';
    return 'Verify OTP';
  };

  return (
    <div style={S.page}>

      {/* ══ Left panel ══════════════════════════════════════════════════════ */}
      <div style={S.left}>
        <div style={S.leftGlow} />
        <div style={S.leftContent}>
          <div style={S.logo}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <polygon points="3 11 22 2 13 21 11 13 3 11" strokeLinejoin="round" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={S.leftTitle}>REAS</h2>
          <p style={S.leftSub}>India's smartest road alert &amp; navigation platform</p>
          <div style={S.cards}>
            {[
              { icon: '🛣️', title: 'Live Road Alerts',   desc: 'Real-time hazard reports from the community' },
              { icon: '🧠', title: 'AI Road Analysis',   desc: 'Satellite image processing with U-Net AI' },
              { icon: '📍', title: 'Smart Navigation',   desc: 'Route guidance with live obstruction avoidance' },
            ].map(c => (
              <div key={c.title} style={S.featureCard}>
                <span style={{ fontSize: 22 }}>{c.icon}</span>
                <div>
                  <div style={S.featureTitle}>{c.title}</div>
                  <div style={S.featureDesc}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Right form ══════════════════════════════════════════════════════ */}
      <div style={S.right}>
        <div style={S.card}>

          {/* Brand */}
          <div style={S.brand}>
            <div style={S.brandIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polygon points="3 11 22 2 13 21 11 13 3 11" strokeLinejoin="round" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={S.brandName}>REAS</span>
          </div>

          <h1 style={S.title}>Welcome back</h1>
          <p style={S.subtitle}>Sign in to access your account</p>

          {/* ── 3 Mode Tabs ── */}
          <div style={S.tabs}>
            <TabBtn label="Email" active={mode === 'email'}      onClick={() => reset('email')} />
            <TabBtn label="Email OTP" active={mode === 'email-otp'} onClick={() => reset('email-otp')}
              badge="✉️" />
            <TabBtn label="Mobile OTP" active={mode === 'phone-otp'} onClick={() => reset('phone-otp')} />
          </div>

          {/* Error */}
          {inputError && (
            <div style={S.err}>
              <Shield size={13} />
              <span>{inputError}</span>
            </div>
          )}

          {/* ── Fields ── */}
          <div style={S.fields}>

            {/* Email / Password */}
            {mode === 'email' && (
              <>
                <Field label="Email address">
                  <IWrap icon={<Mail size={15} />}>
                    <input id="login-email" type="email" placeholder="you@example.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={S.input} />
                  </IWrap>
                </Field>
                <Field label="Password" right={<a href="#" style={S.forgot}>Forgot?</a>}>
                  <IWrap icon={<Lock size={15} />}>
                    <input id="login-password" type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      style={{ ...S.input, paddingRight: 42 }} />
                    <button type="button" style={S.eye} onClick={() => setShowPass(v => !v)}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </IWrap>
                </Field>
              </>
            )}

            {/* Email OTP — enter email */}
            {mode === 'email-otp' && !otpSent && (
              <Field label="Email address">
                <IWrap icon={<Mail size={15} />}>
                  <input id="login-email-otp" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()} style={S.input} />
                </IWrap>
              </Field>
            )}

            {/* Phone OTP — enter phone */}
            {mode === 'phone-otp' && !otpSent && (
              <Field label="Mobile Number">
                <div style={{ display: 'flex', gap: 8 }}>
                  <CountrySelector selectedCountry={country} onSelect={setCountry} />
                  <input id="login-phone" placeholder="98765 43210"
                    value={phone} onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    style={{ ...S.input, flex: 1, paddingLeft: 14 }} />
                </div>
              </Field>
            )}

            {/* OTP input (shared for both OTP modes) */}
            {(mode === 'email-otp' || mode === 'phone-otp') && otpSent && (
              <div style={S.otpBox}>
                <div style={S.otpHint}>
                  {mode === 'email-otp'
                    ? `OTP sent to ${email}`
                    : `OTP sent to ${country.dialCode} ${phone}`}
                </div>
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                  </InputOTPGroup>
                </InputOTP>
                <button style={S.textBtn}
                  onClick={() => { setOtpSent(false); setOtp(''); }}>
                  {mode === 'email-otp' ? 'Change email' : 'Change number'}
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <button id="login-submit"
            style={{ ...S.cta, ...(isLoading ? S.ctaOff : {}) }}
            onClick={handleSubmit} disabled={isLoading}>
            {isLoading
              ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
              : <><span>{btnLabel()}</span><ArrowRight size={17} /></>
            }
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#475569', fontSize: 13 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ padding: '0 12px' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  try {
                    setIsLoading(true);
                    await loginWithGoogle(credentialResponse.credential);
                    toast.success('Login successful!');
                    navigate(from, { replace: true });
                  } catch (err: any) {
                    setInputError(err?.response?.data?.error || 'Google login failed');
                  } finally {
                    setIsLoading(false);
                  }
                }
              }}
              onError={() => {
                setInputError('Google Login Failed');
              }}
              theme="filled_black"
              shape="pill"
            />
          </div>

          {/* Hint */}
          {mode === 'email-otp' && !otpSent && (
            <div style={S.hint}>
              <Zap size={12} />
              <span>OTP will be sent to your email inbox from <strong>shiwangshingh20@gmail.com</strong></span>
            </div>
          )}
          {mode === 'phone-otp' && !otpSent && (
            <div style={S.hint}>
              <Zap size={12} />
              <span>SMS OTP for Indian numbers · <strong>complete Fast2SMS verification</strong> to activate</span>
            </div>
          )}

          <p style={S.foot}>
            No account?{' '}
            <Link to="/auth/signup" style={S.footLink}>Create one</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input { font-family: inherit; }
        input::placeholder { color: #3f4a5e; }
        input:focus { outline: none !important; border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.18) !important; }
      `}</style>
    </div>
  );
}

/* ── Small helpers ─────────────────────────────────────────────────────────── */
function TabBtn({ label, active, onClick, badge }: { label: string; active: boolean; onClick: () => void; badge?: string }) {
  return (
    <button style={{ ...S.tab, ...(active ? S.tabOn : {}) }} onClick={onClick}>
      {badge && <span style={{ fontSize: 13 }}>{badge}</span>}
      {label}
    </button>
  );
}

function Field({ label, right, children }: { label: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>{label}</label>
        {right}
      </div>
      {children}
    </div>
  );
}

function IWrap({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#3f4a5e', pointerEvents: 'none', display: 'flex' }}>{icon}</span>
      {children}
    </div>
  );
}

/* ── Styles ─────────────────────────────────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  page: { display: 'flex', minHeight: '100vh', background: '#080c18', fontFamily: "'Inter',-apple-system,sans-serif", color: '#e2e8f0' },

  left: { flex: '0 0 460px', position: 'relative', background: 'linear-gradient(150deg,#0f172a 0%,#1e1b4b 50%,#1e3a5f 100%)', overflow: 'hidden', display: 'none' },
  leftGlow: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 40% 40%,rgba(99,102,241,0.25) 0%,transparent 65%)', pointerEvents: 'none' },
  leftContent: { position: 'relative', zIndex: 1, padding: '60px 48px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  logo: { width: 60, height: 60, borderRadius: 18, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  leftTitle: { fontSize: 42, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-1.5px', color: '#fff' },
  leftSub: { fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '0 0 44px', maxWidth: 290 },
  cards: { display: 'flex', flexDirection: 'column', gap: 14 },
  featureCard: { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 },
  featureTitle: { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 2 },
  featureDesc: { fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 },

  right: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' },
  card: { width: '100%', maxWidth: 430, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, padding: '38px 34px' },

  brand: { display: 'flex', alignItems: 'center', gap: 9, marginBottom: 28 },
  brandIcon: { width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontWeight: 800, fontSize: 17, color: '#e2e8f0', letterSpacing: '-0.5px' },

  title: { fontSize: 24, fontWeight: 700, margin: '0 0 5px', letterSpacing: '-0.5px', color: '#f8fafc' },
  subtitle: { fontSize: 13, color: '#475569', margin: '0 0 24px' },

  /* 3-tab row */
  tabs: { display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 11, padding: 4, marginBottom: 20 },
  tab: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 4px', borderRadius: 8, border: 'none', background: 'transparent', color: '#475569', fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' },
  tabOn: { background: 'rgba(99,102,241,0.18)', color: '#818cf8' },

  err: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', borderRadius: 9, marginBottom: 14, background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.22)', color: '#fca5a5', fontSize: 13 },

  fields: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 },
  input: { width: '100%', padding: '11px 13px 11px 40px', background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, color: '#e2e8f0', fontSize: 14, transition: 'all 0.2s' },
  eye: { position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#3f4a5e', cursor: 'pointer', padding: 3 },
  forgot: { fontSize: 12, color: '#6366f1', textDecoration: 'none' },

  otpBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0' },
  otpHint: { fontSize: 13, color: '#94a3b8', textAlign: 'center' },
  textBtn: { background: 'none', border: 'none', color: '#6366f1', fontSize: 12, cursor: 'pointer' },

  cta: { width: '100%', padding: '13px', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 22px rgba(99,102,241,0.32)', transition: 'all 0.25s', marginBottom: 14 },
  ctaOff: { opacity: 0.55, cursor: 'not-allowed' },

  hint: { display: 'flex', alignItems: 'flex-start', gap: 6, justifyContent: 'center', fontSize: 12, color: '#475569', marginBottom: 16, textAlign: 'center', lineHeight: 1.5 },

  foot: { textAlign: 'center', fontSize: 13, color: '#475569', margin: 0 },
  footLink: { color: '#818cf8', fontWeight: 600, textDecoration: 'none' },
};
