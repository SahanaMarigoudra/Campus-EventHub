import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, Eye, EyeOff, Loader2, AlertTriangle, LogIn,
  Building2, Award, GraduationCap, Lock, Users, CheckCircle2,
  ChevronRight, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'super_admin') {
        navigate('/admin', { replace: true });
      } else if (['dept_coordinator', 'faculty_coordinator', 'organizer'].includes(user.role)) {
        navigate('/department/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password) {
      setError('Please provide your username/email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await login(loginForm.username.trim(), loginForm.password);
      const role = data?.user?.role;
      if (role === 'super_admin') {
        navigate('/admin');
      } else if (['dept_coordinator', 'faculty_coordinator', 'organizer'].includes(role)) {
        navigate('/department/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message;
      if (serverMsg?.toLowerCase().includes('student')) {
        setError('Student accounts cannot access this portal. Browse events on the homepage instead.');
      } else {
        setError(serverMsg || err.message || 'Login failed. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { icon: <Shield className="w-5 h-5" />, label: 'Super Administrator', desc: 'Full institutional control & reporting', color: '#f87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)' },
    { icon: <Building2 className="w-5 h-5" />, label: 'Department Coordinator', desc: 'Manage department events & registrations', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.25)' },
    { icon: <Award className="w-5 h-5" />, label: 'Faculty Coordinator', desc: 'Oversee event logistics & attendance', color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.25)' },
    { icon: <Users className="w-5 h-5" />, label: 'Event Organizer', desc: 'Create & publish campus events', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)' },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)' }} className="flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div style={{ background: 'radial-gradient(ellipse 700px 600px at 20% 50%, rgba(212,136,15,0.07) 0%, transparent 70%)' }} className="absolute inset-0" />
        <div style={{ background: 'radial-gradient(ellipse 600px 500px at 80% 60%, rgba(99,102,241,0.06) 0%, transparent 70%)' }} className="absolute inset-0" />
      </div>

      <div className="w-full max-w-5xl relative grid lg:grid-cols-2 gap-10 items-center">

        {/* ── LEFT: Info Panel ── */}
        <div className="hidden lg:flex flex-col gap-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full w-fit text-xs font-semibold"
            style={{ background: 'rgba(212,136,15,0.12)', border: '1px solid rgba(212,136,15,0.3)', color: '#e8a025' }}>
            <Sparkles className="w-3.5 h-3.5" />
            Staff &amp; Faculty Portal
          </div>

          <div>
            <h1 className="text-4xl font-black text-white leading-tight tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Institutional<br />
              <span style={{ background: 'linear-gradient(135deg, #d4880f, #f0c060)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Event Management
              </span>
            </h1>
            <p className="mt-3 text-slate-400 text-sm leading-relaxed">
              A secure, role-based portal for faculty, coordinators, and administrators to manage campus-wide events across all departments.
            </p>
          </div>

          <div className="grid gap-2.5">
            {roles.map((r) => (
              <div key={r.label} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: r.bg, border: `1px solid ${r.border}` }}>
                <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: r.bg, border: `1px solid ${r.border}`, color: r.color }}>
                  {r.icon}
                </div>
                <div>
                  <div className="text-xs font-bold" style={{ color: r.color }}>{r.label}</div>
                  <div className="text-[11px] text-slate-400">{r.desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto text-slate-600" />
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl text-xs"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <GraduationCap className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div className="text-slate-400">
              <span className="text-indigo-300 font-semibold">Students —</span> you don&apos;t need an account.{' '}
              <Link to="/" className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition-colors">
                Browse &amp; register for events on the homepage
              </Link>.
            </div>
          </div>
        </div>

        {/* ── RIGHT: Login Form ── */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="card p-8 shadow-2xl"
            style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,18,24,0.92)', backdropFilter: 'blur(20px)' }}>

            {/* Card Header */}
            <div className="flex items-center gap-3 pb-6 mb-6"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #d4880f, #e8a025)' }}>
                <Lock className="w-5 h-5 text-black" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>Staff Sign In</h2>
                <p className="text-xs text-slate-400 mt-0.5">Faculty &amp; Administrator access only</p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl mb-5 text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#94a3b8' }}>
                  Username or Institutional Email
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. admin or faculty@college.edu"
                  className="input text-sm w-full"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#94a3b8' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    className="input text-sm w-full pr-11"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                disabled={loading}
                className="w-full py-3 mt-2 text-sm font-bold flex items-center justify-center gap-2 rounded-xl cursor-pointer transition-all hover:brightness-110 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #d4880f 0%, #e8a025 100%)', color: '#0a0c0f' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {loading ? 'Authenticating…' : 'Sign In to Portal'}
              </button>
            </form>

            {/* Quick-Fill Accounts */}
            <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">⚡ Quick Sign In</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: '⚙️ B.Tech Coord', email: 'btech.coord@college.edu', pw: 'Admin@123' },
                  { label: '🔬 M.Tech Coord', email: 'mtech.coord@college.edu', pw: 'Admin@123' },
                  { label: '💻 MCA Coord', email: 'mca.coord@college.edu', pw: 'Admin@123' },
                  { label: '💼 MBA Coord', email: 'mba.coord@college.edu', pw: 'Admin@123' },
                  { label: '🛡️ Super Admin', email: 'superadmin@college.edu', pw: 'Admin@123' },
                  { label: '🎓 Faculty Reviewer', email: 'faculty.approver@college.edu', pw: 'Admin@123' },
                ].map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => setLoginForm({ username: acc.email, password: acc.pw })}
                    className="p-2 rounded-lg text-left transition-all border cursor-pointer hover:border-amber-400/40 hover:bg-amber-400/5"
                    style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
                  >
                    <div className="font-semibold text-slate-200 text-[11px] truncate">{acc.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{acc.email}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Student redirect */}
            <div className="mt-5 flex items-start gap-2.5 p-3.5 rounded-xl text-xs"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <GraduationCap className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="text-slate-400">
                <span className="text-indigo-300 font-semibold">Are you a Student?</span>{' '}
                <Link to="/" className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300">
                  Click here to browse events &amp; use Student Sign In
                </Link>.
              </div>
            </div>

            <p className="mt-4 text-center text-[11px] text-slate-600">
              Protected by institutional session security &amp; role-based access control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
