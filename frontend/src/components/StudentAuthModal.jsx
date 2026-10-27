import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  X,
  LogIn,
  Ticket,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DEPARTMENT_COURSES = {
  BTECH: ['B.Tech Computer Science', 'B.Tech AI & ML', 'B.Tech Electronics & Comm', 'B.Tech Mechanical'],
  MTECH: ['M.Tech Computer Science', 'M.Tech AI & Data Science', 'M.Tech VLSI Design'],
  MCA: ['MCA Regular (2 Years)', 'MCA Cloud & Big Data'],
  MBA: ['MBA Marketing', 'MBA Finance', 'MBA Business Analytics', 'MBA HR'],
  BCA: ['BCA Regular', 'BCA Data Analytics', 'BCA Cyber Security'],
  BBA: ['BBA Regular', 'BBA International Business', 'BBA Digital Marketing'],
  BCOM: ['B.Com Regular', 'B.Com Honours', 'B.Com Accounting & Finance'],
  BSC: ['B.Sc Computer Science', 'B.Sc Data Science', 'B.Sc Electronics'],
  MSC: ['M.Sc Computer Science', 'M.Sc Data Science', 'M.Sc Mathematics'],
};

export default function StudentAuthModal({
  isOpen = true,
  onClose,
  onSuccess,
  defaultMode = 'login',
  eventTitle = '',
}) {
  const { studentLogin, register } = useAuth();
  const [mode, setMode] = useState(defaultMode); // 'login' | 'register'
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    department_code: '',
    program: '',
    roll_number: '',
    confirm_password: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setMode(defaultMode);
    setError('');
    setSuccess('');
  }, [defaultMode, isOpen]);

  if (!isOpen) return null;

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setSuccess('');
    setForm({ email: '', password: '', full_name: '', department_code: '', program: '', roll_number: '', confirm_password: '' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError('Please enter your institutional email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await studentLogin(form.email.trim(), form.password);
      if (res && res.success) {
        if (onSuccess) onSuccess(res.user);
      } else {
        setError(res?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!form.email.trim()) {
      setError('Please enter your institutional email.');
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await register({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: 'student',
        department_code: form.department_code.trim() || undefined,
        program: form.program.trim() || undefined,
        roll_number: form.roll_number.trim() || undefined,
      });

      if (res && res.success) {
        // If JWT token returned, user is already logged in
        if (res.access_token && onSuccess) {
          onSuccess(res.user);
        } else {
          setSuccess('Account created! Please sign in with your email and password.');
          switchMode('login');
        }
      } else {
        setError(res?.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const inputStyle = {
    width: '100%',
    boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '12px 14px',
    color: '#f1f5f9',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '8px',
  };

  return (
    <div
      onClick={handleBackdrop}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #0f1117, #141820)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '32px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,136,15,0.12)',
          animation: 'slideUp 0.25s ease-out',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #d4880f, #e8a025)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(212,136,15,0.35)',
              }}
            >
              <GraduationCap style={{ width: '24px', height: '24px', color: '#0a0c0f' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f1f5f9', fontFamily: 'Outfit, system-ui, sans-serif' }}>
                {mode === 'login' ? 'Student Sign In' : 'Create Student Account'}
              </h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {mode === 'login' ? 'Sign in to register & view dashboard' : 'Join to participate & get certificates'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '6px',
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#f1f5f9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Context Banner: when triggered from an event card */}
        {eventTitle && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(212,136,15,0.08)',
              border: '1px solid rgba(212,136,15,0.25)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '20px',
            }}
          >
            <Ticket style={{ width: '18px', height: '18px', color: '#e8a025', flexShrink: 0 }} />
            <div style={{ fontSize: '12px', lineHeight: 1.4 }}>
              <p style={{ margin: 0, color: '#f59e0b', fontWeight: 600 }}>
                Registration for: <span style={{ color: '#fff' }}>{eventTitle}</span>
              </p>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>
                Please sign in or register so this event is linked to your Student Dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {['login', 'register'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '9px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Outfit, system-ui, sans-serif',
                background: mode === m ? 'linear-gradient(135deg, #d4880f, #e8a025)' : 'transparent',
                color: mode === m ? '#0a0c0f' : '#64748b',
                boxShadow: mode === m ? '0 2px 10px rgba(212,136,15,0.3)' : 'none',
              }}
            >
              {m === 'login' ? '🔑 Sign In' : '✨ Register'}
            </button>
          ))}
        </div>

        {/* Success message */}
        {success && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '16px',
            }}
          >
            <span style={{ fontSize: '16px' }}>✅</span>
            <p style={{ margin: 0, fontSize: '13px', color: '#86efac', lineHeight: '1.4' }}>{success}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '16px',
            }}
          >
            <AlertTriangle style={{ width: '16px', height: '16px', color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
            <p style={{ margin: 0, fontSize: '13px', color: '#fca5a5', lineHeight: '1.4' }}>{error}</p>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Institutional Email</label>
              <input
                type="email"
                value={form.email}
                autoFocus
                required
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="yourname@college.edu"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(212,136,15,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  required
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Enter your password"
                  style={{ ...inputStyle, padding: '12px 44px 12px 14px' }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(212,136,15,0.5)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#475569',
                    display: 'flex',
                    padding: '4px',
                  }}
                >
                  {showPw ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                marginTop: '4px',
                background: loading ? 'rgba(212,136,15,0.4)' : 'linear-gradient(135deg, #d4880f, #e8a025)',
                border: 'none',
                borderRadius: '10px',
                color: '#0a0c0f',
                fontWeight: 700,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(212,136,15,0.3)',
                fontFamily: 'Outfit, system-ui, sans-serif',
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Signing in…
                </>
              ) : (
                <>
                  <LogIn style={{ width: '16px', height: '16px' }} />
                  {eventTitle ? 'Sign In & Continue Registration' : 'Sign In to Student Portal'}
                </>
              )}
            </button>

            {/* Quick Fill Student Accounts */}
            <div style={{ marginTop: '12px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#e8a025', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ⚡ Quick Sign In
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {[
                  { label: '⚙️ Rohit (B.Tech)', email: 'rohit.btech@college.edu' },
                  { label: '🔬 Sneha (M.Tech)', email: 'sneha.mtech@college.edu' },
                  { label: '💻 Alex (MCA)', email: 'alex.mca@college.edu' },
                  { label: '💼 Priya (MBA)', email: 'priya.mba@college.edu' },
                ].map((s) => (
                  <button
                    key={s.email}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, email: s.email, password: 'Student@123' }))}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(232,160,37,0.4)';
                      e.currentTarget.style.background = 'rgba(232,160,37,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#e2e8f0' }}>{s.label}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.email}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text"
                value={form.full_name}
                autoFocus
                required
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="e.g. Alex Kumar"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(212,136,15,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <div>
              <label style={labelStyle}>Institutional Email</label>
              <input
                type="email"
                value={form.email}
                required
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="yourname@college.edu"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(212,136,15,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Department
              </label>
              <select
                value={form.department_code}
                onChange={(e) => {
                  const code = e.target.value;
                  const defaultProg = DEPARTMENT_COURSES[code] ? DEPARTMENT_COURSES[code][0] : '';
                  setForm((f) => ({ ...f, department_code: code, program: defaultProg }));
                }}
                style={{ ...inputStyle, background: '#141820', color: '#f1f5f9' }}
              >
                <option value="">Select Department</option>
                <option value="BTECH">B.Tech — Engineering</option>
                <option value="MTECH">M.Tech — Technology</option>
                <option value="MCA">MCA — Computer Applications</option>
                <option value="MBA">MBA — Business Administration</option>
                <option value="BCA">BCA — Computer Applications</option>
                <option value="BBA">BBA — Business Administration</option>
                <option value="BCOM">B.Com — Commerce</option>
                <option value="BSC">B.Sc — Science</option>
                <option value="MSC">M.Sc — Science</option>
              </select>
            </div>

            {form.department_code && DEPARTMENT_COURSES[form.department_code] && (
              <div>
                <label style={labelStyle}>Course / Degree Specialization</label>
                <select
                  value={form.program}
                  onChange={(e) => setForm((f) => ({ ...f, program: e.target.value }))}
                  style={{ ...inputStyle, background: '#141820', color: '#f1f5f9' }}
                >
                  {DEPARTMENT_COURSES[form.department_code].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label style={labelStyle}>Institutional Roll Number (Optional)</label>
              <input
                type="text"
                value={form.roll_number}
                onChange={(e) => setForm((f) => ({ ...f, roll_number: e.target.value }))}
                placeholder="e.g. 2026-CSE-045"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(212,136,15,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  required
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  style={{ ...inputStyle, padding: '12px 44px 12px 14px' }}
                  onFocus={(e) => (e.target.style.borderColor = 'rgba(212,136,15,0.5)')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#475569',
                    display: 'flex',
                    padding: '4px',
                  }}
                >
                  {showPw ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                </button>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                value={form.confirm_password}
                required
                onChange={(e) => setForm((f) => ({ ...f, confirm_password: e.target.value }))}
                placeholder="Re-enter password"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = 'rgba(212,136,15,0.5)')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                marginTop: '4px',
                background: loading ? 'rgba(212,136,15,0.4)' : 'linear-gradient(135deg, #d4880f, #e8a025)',
                border: 'none',
                borderRadius: '10px',
                color: '#0a0c0f',
                fontWeight: 700,
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(212,136,15,0.3)',
                fontFamily: 'Outfit, system-ui, sans-serif',
                transition: 'all 0.2s',
              }}
            >
              {loading ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Creating account…
                </>
              ) : (
                <>
                  <GraduationCap style={{ width: '16px', height: '16px' }} />
                  {eventTitle ? 'Create Account & Continue Registration' : 'Create Student Account'}
                </>
              )}
            </button>

            {/* Info note */}
            <div
              style={{
                padding: '12px 14px',
                marginTop: '4px',
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: '10px',
              }}
            >
              <p style={{ margin: 0, fontSize: '11px', color: '#93c5fd', lineHeight: '1.6', textAlign: 'center' }}>
                🎓 Register with your college email to apply for events and view all your registrations and <strong>participation certificates</strong> in your Student Dashboard.
              </p>
            </div>
          </form>
        )}

        {/* Staff login link */}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#475569' }}>
          Faculty / Staff?{' '}
          <Link
            to="/login"
            onClick={onClose}
            style={{ color: '#94a3b8', textDecoration: 'underline', fontWeight: 600 }}
          >
            Staff Sign In →
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
