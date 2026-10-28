import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import EventsPage from './pages/EventsPage';
import CalendarPage from './pages/CalendarPage';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import DepartmentDashboard from './pages/DepartmentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CertificateVerifyPage from './pages/CertificateVerifyPage';
import ProtectedRoute from './layouts/ProtectedRoute';


function Footer() {
  return (
    <footer style={{ background: '#07080b', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '56px 0 32px 0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        
        {/* Top 4-Column Directory */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-white/5">
          {/* Col 1: Platform Brand */}
          <div className="space-y-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #d4880f, #e8a025)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '15px', color: '#0a0c0f', flexShrink: 0 }}>E</div>
              <div>
                <p style={{ fontFamily: 'Outfit, system-ui, sans-serif', fontSize: '15px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Campus EventHub</p>
                <p style={{ fontSize: '10px', color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Management System</p>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
              Centralized platform for inter-departmental technical symposiums, management colloquiums, cultural fests, and hackathons.
            </p>
          </div>

          {/* Col 2: Navigation & Verification */}
          <div className="space-y-2.5">
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Quick Portals</p>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><a href="/events" className="hover:text-amber-400 transition-colors">Browse Campus Events</a></li>
              <li><a href="/calendar" className="hover:text-amber-400 transition-colors">Academic Event Calendar</a></li>
              <li><a href="/login" className="hover:text-amber-400 transition-colors">Student & Faculty Sign In</a></li>
              <li><a href="/#support-contact" className="hover:text-amber-400 transition-colors">Helpdesk & Support</a></li>
            </ul>
          </div>

          {/* Col 3: Support & Contacts */}
          <div className="space-y-2.5">
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contact & Helpdesk</p>
            <div className="space-y-1.5 text-xs text-slate-400">
              <p className="flex items-center gap-2">
                <span className="text-amber-400 font-semibold">Helpline:</span> +91 (080) 2839-4500
              </p>
              <p className="flex items-center gap-2">
                <span className="text-teal-400 font-semibold">Email:</span> events.support@college.edu
              </p>
              <p className="flex items-center gap-2">
                <span className="text-purple-400 font-semibold">WhatsApp:</span> +91 98765 43210
              </p>
              <p className="text-[11px] text-slate-500">Hours: Mon–Sat, 9:00 AM – 5:30 PM</p>
            </div>
          </div>

          {/* Col 4: Campus Office */}
          <div className="space-y-2.5">
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Event Coordination Cell</p>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
              Room 204, 2nd Floor, Administrative Block<br />
              Main Campus, Bangalore, Karnataka — 560058
            </p>
            <span className="inline-block mt-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2.5 py-1 rounded-md">
              ● Official Institution Helpdesk
            </span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '16px', paddingTop: '24px' }}>
          <p style={{ fontSize: '11px', color: '#475569', margin: 0, textAlign: 'center' }}>
            © 2026 Campus EventHub · All rights reserved · Multi-Departmental Academic Platform
          </p>
        </div>

      </div>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen flex flex-col" style={{ background: '#0a0c0f', color: '#e8eaf0' }}>
            <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Event Discovery */}
              <Route path="/" element={<EventsPage />} />
              <Route path="/events" element={<EventsPage />} />

              {/* Campus Calendar */}
              <Route path="/calendar" element={<CalendarPage />} />

              {/* Authentication */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin/login" element={<Navigate to="/login" replace />} />

              {/* Public Certificate Verification */}
              <Route path="/verify-certificate/:certNumber" element={<CertificateVerifyPage />} />


              {/* Student Portal */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student', 'super_admin', 'dept_coordinator', 'faculty_coordinator', 'organizer']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Department Coordinator & Faculty Portal */}
              <Route
                path="/department/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['dept_coordinator', 'faculty_coordinator', 'organizer', 'super_admin']}>
                    <DepartmentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/departments/:id/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['dept_coordinator', 'faculty_coordinator', 'organizer', 'super_admin']}>
                    <DepartmentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Executive Super Admin Hub */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
            <Footer />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
