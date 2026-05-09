import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Car, Bike, Footprints, MapPin, Bell, ArrowRight, ArrowLeft, Check, Loader2, Shield, Zap } from 'lucide-react';
import { useUserStore } from '@/stores';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { CountrySelector } from '@/components/ui/country-selector';
import { COUNTRIES, Country } from '@/lib/countries';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { GoogleLogin } from '@react-oauth/google';

const VEHICLES = [
  { type: 'car',  Icon: Car,        label: 'Car' },
  { type: 'bike', Icon: Bike,       label: 'Bike' },
  { type: 'auto', Icon: Car,        label: 'Auto' },
  { type: 'walk', Icon: Footprints, label: 'None' },
];

const STEPS = ['Your Info', 'Preferences', 'Permissions', 'Verify Phone'];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [vehicle, setVehicle] = useState('car');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [otp, setOtp] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const { isAuthenticated, sendOTP, verifyOTP, loginWithGoogle } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => { if (isAuthenticated) navigate('/dashboard'); }, [isAuthenticated, navigate]);

  const handleSendOTP = async () => {
    setIsLoading(true);
    try {
      const id = `${selectedCountry.dialCode}${form.phone}`.replace(/[\s-()]/g, '');
      await sendOTP({ phone: id });
      toast.success('Verification code sent!', { description: 'Check your backend console window for the OTP.' });
      setStep(4);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send OTP');
    } finally { setIsLoading(false); }
  };

  const handleSignup = async () => {
    setIsLoading(true);
    try {
      const id = `${selectedCountry.dialCode}${form.phone}`.replace(/[\s-()]/g, '');
      await verifyOTP({ phone: id, otp });
      const { data } = await api.post('/users/signup', { ...form, phone: id, vehicleType: vehicle });
      localStorage.setItem('reas-user', JSON.stringify(data.user));
      localStorage.setItem('reas-token', data.token);
      toast.success('Account created! Welcome to REAS!');
      window.location.href = '/onboarding';
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setIsLoading(false); }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!form.name.trim())          { toast.error('Please enter your full name'); return; }
      if (form.phone.length < 10)     { toast.error('Please enter a valid mobile number'); return; }
    }
    if (step < 3) setStep(s => s + 1);
    else if (step === 3) handleSendOTP();
    else handleSignup();
  };

  return (
    <div style={S.page}>
      {/* ── Left panel ── */}
      <div style={S.left}>
        <div style={S.glow} />
        <div style={S.leftInner}>
          <div style={S.logo}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
              <polygon points="3 11 22 2 13 21 11 13 3 11" strokeLinejoin="round" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={S.leftTitle}>Join REAS</h2>
          <p style={S.leftSub}>Create your account in 4 quick steps</p>

          {/* Step list */}
          <div style={S.stepList}>
            {STEPS.map((label, i) => {
              const n = i + 1;
              const done = step > n;
              const active = step === n;
              return (
                <div key={n} style={S.stepRow}>
                  {/* connector line */}
                  {n < STEPS.length && (
                    <div style={{ ...S.connector, ...(step > n ? S.connectorDone : {}) }} />
                  )}
                  <div style={{ ...S.stepDot, ...(done ? S.dotDone : active ? S.dotActive : S.dotPending) }}>
                    {done ? <Check size={13} /> : <span style={{ fontSize: 12, fontWeight: 700 }}>{n}</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: active ? '#fff' : done ? '#a5b4fc' : 'rgba(255,255,255,0.35)', transition: 'color 0.3s' }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                      {['Name, phone & email', 'Vehicle & language', 'Location & alerts', 'Phone verification'][i]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right form ── */}
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

          {/* Header */}
          <h1 style={S.title}>Create Account</h1>
          <p style={S.subtitle}>Step {step} of 4 — {STEPS[step - 1]}</p>

          {/* Progress bar */}
          <div style={S.progressTrack}>
            <div style={{ ...S.progressFill, width: `${(step / 4) * 100}%` }} />
          </div>

          {/* ── Step 1: Info ── */}
          {step === 1 && (
            <div style={S.fields}>
              <Field label="Full Name">
                <IWrap icon={<User size={15} />}>
                  <input id="signup-name" placeholder="Your full name" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} style={S.input} />
                </IWrap>
              </Field>
              <Field label="Mobile Number">
                <div style={{ display: 'flex', gap: 8 }}>
                  <CountrySelector selectedCountry={selectedCountry} onSelect={setSelectedCountry} />
                  <input id="signup-phone" placeholder="98765 43210" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    style={{ ...S.input, flex: 1, paddingLeft: 14 }} />
                </div>
              </Field>
              <Field label={<>Email <span style={{ color: '#3f4a5e', fontWeight: 400 }}>(optional)</span></>}>
                <IWrap icon={<Mail size={15} />}>
                  <input id="signup-email" type="email" placeholder="you@example.com" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} style={S.input} />
                </IWrap>
              </Field>
            </div>
          )}

          {/* ── Step 2: Preferences ── */}
          {step === 2 && (
            <div style={S.fields}>
              <Field label="Vehicle Type">
                <div style={S.vehicleGrid}>
                  {VEHICLES.map(({ type, Icon, label }) => (
                    <button key={type} onClick={() => setVehicle(type)}
                      style={{ ...S.vBtn, ...(vehicle === type ? S.vBtnOn : {}) }}>
                      <Icon size={20} />
                      <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Preferred Language">
                <select style={S.select}>
                  {['English','हिन्दी (Hindi)','தமிழ் (Tamil)','తెలుగు (Telugu)','ಕನ್ನಡ (Kannada)','മലയാളം (Malayalam)','বাংলা (Bengali)','मराठी (Marathi)'].map(l => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          {/* ── Step 3: Permissions ── */}
          {step === 3 && (
            <div style={S.fields}>
              {[
                { Icon: MapPin, label: 'Location Access',    desc: 'For real-time navigation and proximity alerts' },
                { Icon: Bell,   label: 'Notifications',      desc: 'Get hazard alerts on your saved routes' },
                { Icon: Shield, label: 'Data Security',      desc: 'All data is encrypted and never shared' },
              ].map(({ Icon, label, desc }) => (
                <div key={label} style={S.permCard}>
                  <div style={S.permIcon}><Icon size={18} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={S.permTitle}>{label}</div>
                    <div style={S.permDesc}>{desc}</div>
                  </div>
                  <button style={S.allowBtn}>Allow</button>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 4: OTP ── */}
          {step === 4 && (
            <div style={S.otpBox}>
              <div style={S.otpBadge}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18" strokeLinecap="round" strokeWidth="3"/>
                </svg>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Verify your phone</p>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Code sent to {selectedCountry.dialCode} {form.phone}</p>
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>{[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
              </InputOTP>
              <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#475569' }}>
                <Zap size={11}/> OTP is printed in your backend console window
              </div>
              <button style={S.textBtn} onClick={() => { setStep(1); setOtp(''); }}>Wrong number? Go back</button>
            </div>
          )}

          {/* Buttons */}
          <div style={S.btnRow}>
            {step > 1 && (
              <button style={S.back} onClick={() => setStep(s => s - 1)} disabled={isLoading}>
                <ArrowLeft size={15} /> Back
              </button>
            )}
            <button id="signup-next" style={{ ...S.cta, ...(isLoading ? S.ctaOff : {}), flex: 1 }}
              onClick={handleNext} disabled={isLoading}>
              {isLoading
                ? <Loader2 size={17} style={{ animation: 'spin 0.8s linear infinite' }} />
                : step < 4
                  ? <><span>Next</span><ArrowRight size={16}/></>
                  : <><span>Create Account</span><Check size={16}/></>
              }
            </button>
          </div>

          {step === 1 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#475569', fontSize: 13 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ padding: '0 12px' }}>or sign up with</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    if (credentialResponse.credential) {
                      try {
                        setIsLoading(true);
                        await loginWithGoogle(credentialResponse.credential);
                        toast.success('Account ready! Welcome to REAS!');
                        window.location.href = '/onboarding';
                      } catch (err: any) {
                        toast.error(err?.response?.data?.error || 'Google signup failed');
                      } finally {
                        setIsLoading(false);
                      }
                    }
                  }}
                  onError={() => {
                    toast.error('Google Signup Failed');
                  }}
                  theme="filled_black"
                  shape="pill"
                  text="signup_with"
                />
              </div>
            </>
          )}

          <p style={S.foot}>
            Already have an account?{' '}
            <Link to="/auth/login" style={S.footLink}>Sign in</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input, select { font-family: inherit; }
        input::placeholder { color: #3f4a5e; }
        input:focus, select:focus { outline: none !important; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.18) !important; }
      `}</style>
    </div>
  );
}

/* ── Helpers ── */
function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>{label}</label>
      {children}
    </div>
  );
}
function IWrap({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'#3f4a5e', pointerEvents:'none', display:'flex' }}>{icon}</span>
      {children}
    </div>
  );
}

/* ── Styles ── */
const S: Record<string, React.CSSProperties> = {
  page: { display:'flex', minHeight:'100vh', background:'#080c18', fontFamily:"'Inter',-apple-system,sans-serif", color:'#e2e8f0' },

  left: { flex:'0 0 420px', position:'relative', background:'linear-gradient(150deg,#0f172a,#1e1b4b 60%,#172554)', display:'none', overflow:'hidden' },
  glow: { position:'absolute', inset:0, background:'radial-gradient(ellipse at 35% 45%,rgba(99,102,241,0.22) 0%,transparent 65%)' },
  leftInner: { position:'relative', zIndex:1, padding:'60px 44px', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center' },
  logo: { width:58, height:58, borderRadius:17, background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.3)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:22 },
  leftTitle: { fontSize:36, fontWeight:800, margin:'0 0 10px', letterSpacing:'-1px', color:'#fff' },
  leftSub:   { fontSize:14, color:'rgba(255,255,255,0.5)', lineHeight:1.6, margin:'0 0 40px' },

  stepList:  { display:'flex', flexDirection:'column', gap:24 },
  stepRow:   { display:'flex', alignItems:'flex-start', gap:14, position:'relative' },
  connector: { position:'absolute', left:14, top:32, width:1, height:24, background:'rgba(255,255,255,0.1)', transition:'background 0.3s' },
  connectorDone: { background:'rgba(99,102,241,0.5)' },
  stepDot:   { width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.3s' },
  dotActive: { background:'#6366f1', boxShadow:'0 0 14px rgba(99,102,241,0.55)', color:'#fff' },
  dotDone:   { background:'rgba(99,102,241,0.25)', color:'#a5b4fc' },
  dotPending:{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.25)' },

  right: { flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px' },
  card:  { width:'100%', maxWidth:420, background:'rgba(255,255,255,0.035)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:22, padding:'38px 34px' },

  brand:    { display:'flex', alignItems:'center', gap:9, marginBottom:26 },
  brandIcon:{ width:34, height:34, borderRadius:9, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' },
  brandName:{ fontWeight:800, fontSize:17, color:'#e2e8f0', letterSpacing:'-0.5px' },

  title:   { fontSize:23, fontWeight:700, margin:'0 0 4px', letterSpacing:'-0.5px', color:'#f8fafc' },
  subtitle:{ fontSize:12, color:'#475569', margin:'0 0 16px' },

  progressTrack: { height:4, background:'rgba(255,255,255,0.07)', borderRadius:2, overflow:'hidden', marginBottom:26 },
  progressFill:  { height:'100%', background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:2, transition:'width 0.5s cubic-bezier(0.4,0,0.2,1)' },

  fields: { display:'flex', flexDirection:'column', gap:14, marginBottom:22 },
  input:  { width:'100%', padding:'11px 13px 11px 40px', background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, color:'#e2e8f0', fontSize:14, transition:'all 0.2s' },

  vehicleGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8 },
  vBtn:  { display:'flex', flexDirection:'column', alignItems:'center', gap:6, padding:'14px 6px', borderRadius:12, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:'#475569', cursor:'pointer', transition:'all 0.2s' },
  vBtnOn:{ border:'1px solid rgba(99,102,241,0.45)', background:'rgba(99,102,241,0.14)', color:'#818cf8' },

  select:{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, color:'#e2e8f0', fontSize:14, transition:'all 0.2s' },

  permCard: { display:'flex', alignItems:'center', gap:13, padding:'14px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' },
  permIcon: { width:38, height:38, borderRadius:9, background:'rgba(99,102,241,0.14)', display:'flex', alignItems:'center', justifyContent:'center', color:'#818cf8', flexShrink:0 },
  permTitle:{ fontSize:13, fontWeight:600, color:'#e2e8f0', marginBottom:2 },
  permDesc: { fontSize:11, color:'#475569', lineHeight:1.4 },
  allowBtn: { padding:'7px 13px', borderRadius:8, background:'rgba(99,102,241,0.18)', border:'1px solid rgba(99,102,241,0.3)', color:'#818cf8', fontSize:12, fontWeight:600, cursor:'pointer', flexShrink:0 },

  otpBox:  { display:'flex', flexDirection:'column', alignItems:'center', gap:12, marginBottom:22, textAlign:'center' },
  otpBadge:{ width:60, height:60, borderRadius:16, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center' },
  textBtn: { background:'none', border:'none', color:'#6366f1', fontSize:12, cursor:'pointer' },

  btnRow:{ display:'flex', gap:10, marginBottom:18 },
  back:  { display:'flex', alignItems:'center', gap:6, padding:'12px 16px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:11, color:'#94a3b8', fontSize:13, fontWeight:500, cursor:'pointer', flexShrink:0 },
  cta:   { display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'13px', borderRadius:11, border:'none', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 22px rgba(99,102,241,0.32)', transition:'all 0.25s' },
  ctaOff:{ opacity:0.55, cursor:'not-allowed' },

  foot:   { textAlign:'center', fontSize:13, color:'#475569', margin:0 },
  footLink:{ color:'#818cf8', fontWeight:600, textDecoration:'none' },
};
