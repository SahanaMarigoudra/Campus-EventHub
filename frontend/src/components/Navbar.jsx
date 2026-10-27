import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Calendar,
  Compass,
  Bell,
  Shield,
  Layers,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Award,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  X,
  LogIn,
  LifeBuoy,
  Menu,
} from 'lucide-react';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api';
import StudentAuthModal from './StudentAuthModal';

/* ─── Main Navbar ─────────────────────────────────────────────────────────── */
export default function Navbar() {
  const { user, isAuthenticated, logout, quickSwitch, demoAccounts } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showStudentLogin, setShowStudentLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef(null);
  const userRef = useRef(null);
  const demoRef = useRef(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifMenu(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
      if (demoRef.current && !demoRef.current.contains(e.target)) setShowDemoMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = () => {
    fetchNotifications()
      .then((res) => {
        if (res.success) {
          setNotifications(res.notifications || []);
          setUnreadCount(res.unread_count || 0);
        }
      })
      .catch(() => {});
  };

  const handleMarkRead = (id, link) => {
    markNotificationRead(id).then(() => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    });
    setShowNotifMenu(false);
    if (link) navigate(link);
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead().then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    });
  };

  const handleRoleSwitch = async (key) => {
    setShowDemoMenu(false);
    await quickSwitch(key);
    navigate('/');
  };

  const handleStudentLoginSuccess = () => {
    setShowStudentLogin(false);
    navigate('/dashboard');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin':
        return <span className="bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs px-2 py-0.5 rounded-full font-medium">Super Admin</span>;
      case 'dept_coordinator':
        return <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs px-2 py-0.5 rounded-full font-medium">Dept Coordinator</span>;
      case 'faculty_coordinator':
        return <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs px-2 py-0.5 rounded-full font-medium">Faculty Reviewer</span>;
      default:
        return <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs px-2 py-0.5 rounded-full font-medium">Student</span>;
    }
  };

  return (
    <>
      <StudentAuthModal
        isOpen={showStudentLogin}
        onClose={() => setShowStudentLogin(false)}
        onSuccess={handleStudentLoginSuccess}
      />

      <header className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: 'rgba(10,12,15,0.93)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="app-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
            {/* Logo & College Identity */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-black text-base shadow-lg group-hover:scale-105 transition-transform"
                style={{ background: 'linear-gradient(135deg, #d4880f, #e8a025)' }}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold tracking-tight flex items-center gap-2 text-base text-white" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                  Campus
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: 'rgba(212,136,15,0.15)', color: '#e8a025', border: '1px solid rgba(212,136,15,0.3)' }}>
                    EventHub
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                  Interdepartmental Event Management
                </p>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-0.5 text-sm font-medium">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-sm ${
                  location.pathname === '/'
                    ? 'text-amber-300 font-semibold bg-amber-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                <Compass className="w-4 h-4" />
                Events
              </Link>

              <Link
                to="/calendar"
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-sm ${
                  location.pathname === '/calendar'
                    ? 'text-amber-300 font-semibold bg-amber-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </Link>

              <a
                href="/#support-contact"
                className="px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 hover:bg-white/5"
              >
                <LifeBuoy className="w-4 h-4 text-amber-400/80" />
                Support & Contact
              </a>

              {/* Portal Link based on Role */}
              {user?.role === 'super_admin' && (
                <Link
                  to="/admin"
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-sm ${
                    location.pathname.startsWith('/admin')
                      ? 'text-red-300 font-semibold bg-red-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                  }`}
                >
                  <Shield className="w-4 h-4 text-red-400" />
                  Admin
                </Link>
              )}

              {['dept_coordinator', 'faculty_coordinator', 'organizer'].includes(user?.role) && (
                <Link
                  to="/department/dashboard"
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-sm ${
                    location.pathname.includes('/department/dashboard')
                      ? 'text-teal-300 font-semibold bg-teal-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-4 h-4 text-teal-400" />
                  {user.department_code || 'Dept'} Portal
                </Link>
              )}

              {user?.role === 'student' && (
                <Link
                  to="/dashboard"
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-sm ${
                    location.pathname === '/dashboard'
                      ? 'text-amber-300 font-semibold bg-amber-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                  }`}
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  My Portal
                </Link>
              )}
            </nav>

            {/* Right Controls */}
            <div className="flex items-center gap-3">

              {/* Notifications Popover */}
              {isAuthenticated && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <div className="font-semibold text-white text-sm flex items-center gap-2">
                          <Bell className="w-4 h-4" style={{ color: '#e8a025' }} />
                          Notifications
                          {unreadCount > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(212,136,15,0.15)', color: '#e8a025' }}>
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-semibold hover:underline cursor-pointer" style={{ color: '#e8a025' }}
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-sm">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleMarkRead(n.id, n.link)}
                              className={`p-3 text-xs transition-all cursor-pointer ${
                                !n.is_read ? 'bg-blue-50/50 dark:bg-blue-950/30 font-medium' : ''
                              }`}
                              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                              onMouseLeave={e => e.currentTarget.style.background = !n.is_read ? 'rgba(59,130,246,0.06)' : 'transparent'}
                            >
                              <div className="flex items-start gap-2">
                                {!n.is_read ? (
                                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" style={{ boxShadow: '0 0 6px rgba(59,130,246,0.6)' }} />
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-transparent mt-1 shrink-0" />
                                )}
                                <div className="flex-1">
                                  <p className="text-slate-900 dark:text-white font-semibold text-xs">{n.title}</p>
                                  <p className="text-slate-600 dark:text-slate-300 mt-0.5 text-[11px] leading-relaxed">{n.message}</p>
                                  <div className="flex items-center justify-between mt-1">
                                    <p className="text-[10px] text-slate-400">
                                      {new Date(n.created_at).toLocaleDateString()}
                                    </p>
                                    {n.link && (
                                      <span className="text-[10px] font-semibold" style={{ color: '#e8a025' }}>View →</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Profile or Login Buttons */}
              {isAuthenticated ? (
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-1.5 rounded-xl transition-colors hover:bg-white/5"
                  >
                    <div className="w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #d4880f, #e8a025)', color: '#0a0c0f' }}>
                      {user?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-semibold text-white leading-tight">{user?.full_name}</p>
                      <p className="text-[10px] text-slate-500">{user?.department_code || user?.role?.replace('_', ' ')}</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl py-2 z-50 text-xs" style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                        <p className="font-bold text-white">{user?.full_name}</p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                        <div className="mt-2">{getRoleBadge(user?.role)}</div>
                      </div>

                      {user?.role === 'student' && (
                        <Link to="/dashboard" onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-amber-300 hover:bg-white/4 transition-colors">
                          <User className="w-4 h-4" /> My Student Portal
                        </Link>
                      )}

                      {['dept_coordinator', 'faculty_coordinator', 'organizer'].includes(user?.role) && (
                        <Link to="/department/dashboard" onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-teal-300 hover:bg-white/4 transition-colors">
                          <Layers className="w-4 h-4" /> Department Dashboard
                        </Link>
                      )}

                      {user?.role === 'super_admin' && (
                        <Link to="/admin" onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-300 hover:bg-white/4 transition-colors">
                          <Shield className="w-4 h-4" /> Admin Dashboard
                        </Link>
                      )}

                      <div className="my-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }} />

                      <button
                        onClick={() => { setShowUserMenu(false); logout(); navigate('/'); }}
                        className="w-full text-left flex items-center gap-2 px-4 py-2 cursor-pointer transition-colors"
                        style={{ color: '#f87171' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Not authenticated: show Student Sign In + Staff Sign In ── */
                <div className="flex items-center gap-2">
                  {/* Student Sign In (desktop/tablet) */}
                  <button
                    id="student-signin-btn"
                    onClick={() => setShowStudentLogin(true)}
                    className="hidden sm:flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#e2e8f0',
                      fontFamily: 'Outfit, system-ui, sans-serif',
                    }}
                  >
                    <GraduationCap style={{ width: '14px', height: '14px' }} />
                    Student Sign In
                  </button>

                  {/* Staff Sign In (desktop/tablet) */}
                  <Link
                    to="/login"
                    id="staff-signin-btn"
                    className="hidden sm:flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg text-black transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #d4880f, #e8a025)',
                      fontFamily: 'Outfit, system-ui, sans-serif',
                      boxShadow: '0 2px 8px rgba(212,136,15,0.25)',
                    }}
                  >
                    <Shield style={{ width: '14px', height: '14px' }} />
                    Staff Sign In
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t px-4 py-4 space-y-1.5 backdrop-blur-2xl animate-in slide-in-from-top-2 duration-200"
            style={{ background: 'rgba(15,17,23,0.98)', borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === '/' ? 'text-amber-300 bg-amber-500/10 font-semibold' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-400" />
              Events
            </Link>

            <Link
              to="/calendar"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === '/calendar' ? 'text-amber-300 bg-amber-500/10 font-semibold' : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              Calendar
            </Link>

            <a
              href="/#support-contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
            >
              <LifeBuoy className="w-4 h-4 text-amber-400" />
              Support &amp; Contact
            </a>

            {/* Role Portal Link on Mobile */}
            {user?.role === 'super_admin' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 bg-red-500/10"
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </Link>
            )}

            {['dept_coordinator', 'faculty_coordinator', 'organizer'].includes(user?.role) && (
              <Link
                to="/department/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-teal-300 bg-teal-500/10"
              >
                <Layers className="w-4 h-4" />
                {user.department_code || 'Dept'} Portal
              </Link>
            )}

            {user?.role === 'student' && (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-300 bg-amber-500/10"
              >
                <Award className="w-4 h-4" />
                My Student Portal
              </Link>
            )}

            {/* Mobile Auth Actions */}
            {!isAuthenticated ? (
              <div className="pt-3 mt-2 border-t flex flex-col gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); setShowStudentLogin(true); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                >
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  Student Sign In
                </button>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-black"
                  style={{ background: 'linear-gradient(135deg, #d4880f, #e8a025)' }}
                >
                  <Shield className="w-4 h-4" />
                  Staff Sign In
                </Link>
              </div>
            ) : (
              <div className="pt-3 mt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <button
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); logout(); navigate('/'); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer text-red-400 bg-red-500/10 border border-red-500/20"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out ({user?.full_name?.split(' ')[0] || 'User'})
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}
