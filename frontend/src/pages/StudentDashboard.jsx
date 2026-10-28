import { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Award,
  Bookmark as BookmarkIcon,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Share2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchMyRegistrations,
  fetchMyCertificates,
  fetchMyBookmarks,
  cancelRegistration,
  fetchEvents,
} from '../services/api';
import RegistrationModal from '../components/RegistrationModal';
import EventDetailModal from '../components/EventDetailModal';
import HackathonCertificateModal, { formatPrizeRupee } from '../components/HackathonCertificateModal';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';


export default function StudentDashboard() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('registrations'); // registrations, certificates, bookmarks, recommended

  const toast = useToast();
  const [selectedCert, setSelectedCert] = useState(null);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState(null);
  const [selectedEventForRegister, setSelectedEventForRegister] = useState(null);

  // In-app cancellation confirmation modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedCancelReg, setSelectedCancelReg] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = () => {
    setLoading(true);
    Promise.all([
      fetchMyRegistrations(),
      fetchMyCertificates(),
      fetchMyBookmarks(),
      fetchEvents({ department: user?.department_code, status: 'published', per_page: 6 }),
    ])
      .then(([regRes, certRes, bmRes, recRes]) => {
        if (regRes.success) setRegistrations(regRes.registrations || []);
        if (certRes.success) setCertificates(certRes.certificates || []);
        if (bmRes.success) setBookmarks(bmRes.bookmarks || []);
        if (recRes.success) setRecommended(recRes.events || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleOpenCancelModal = (reg) => {
    setSelectedCancelReg(reg);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedCancelReg) return;
    setCancelling(true);
    try {
      const res = await cancelRegistration(selectedCancelReg.id);
      if (res.success) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === selectedCancelReg.id ? { ...r, status: 'cancelled' } : r))
        );
        toast.success('Registration cancelled successfully. Your seat has been released.');
        setCancelModalOpen(false);
        setSelectedCancelReg(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel registration. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const confirmedCount = registrations.filter((r) => r.status === 'confirmed').length;

  return (
    <div style={{ background: '#0a0c0f', minHeight: 'calc(100vh - 64px)', color: '#e8eaf0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 40px' }} className="space-y-8">
        
        {/* Student Profile Hero Header */}
        <div
          style={{
            background: 'linear-gradient(145deg, #12151e 0%, #0d1017 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}
          className="rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div
              style={{
                background: 'linear-gradient(135deg, #d4880f, #e8a025)',
                color: '#0a0c0f',
              }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shrink-0"
            >
              {user?.full_name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1
                  className="text-2xl font-extrabold text-white"
                  style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
                >
                  {user?.full_name || 'Student Portal'}
                </h1>
                <span
                  style={{
                    background: 'rgba(212,136,15,0.15)',
                    color: '#e8a025',
                    border: '1px solid rgba(212,136,15,0.3)',
                  }}
                  className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                >
                  {user?.department_code || 'MCA'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Roll No: <span className="font-mono font-bold text-amber-300">{user?.roll_number || 'N/A'}</span> • {user?.program || 'Academic Program'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Quick Metrics Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              className="p-3.5 rounded-2xl text-center min-w-[90px]"
            >
              <span className="block text-2xl font-extrabold text-white" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                {confirmedCount}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Registered</span>
            </div>
            <div
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              className="p-3.5 rounded-2xl text-center min-w-[90px]"
            >
              <span className="block text-2xl font-extrabold text-teal-400" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                {certificates.length}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Certificates</span>
            </div>
            <div
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              className="p-3.5 rounded-2xl text-center min-w-[90px]"
            >
              <span className="block text-2xl font-extrabold text-amber-400" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                {bookmarks.length}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Saved</span>
            </div>
            <div
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              className="p-3.5 rounded-2xl text-center min-w-[90px]"
            >
              <span className="block text-2xl font-extrabold text-emerald-400" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                Active
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Status</span>
            </div>
          </div>
        </div>

        {/* Tab Headers */}
        <div
          style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)' }}
          className="flex rounded-2xl p-1.5 text-xs font-bold gap-1.5 overflow-x-auto"
        >
          <button
            onClick={() => setActiveTab('registrations')}
            style={{
              background: activeTab === 'registrations' ? 'linear-gradient(135deg, #d4880f, #e8a025)' : 'transparent',
              color: activeTab === 'registrations' ? '#0a0c0f' : '#94a3b8',
            }}
            className="px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 font-bold"
          >
            <Calendar className="w-4 h-4" />
            My Registrations ({registrations.length})
          </button>

          <button
            onClick={() => setActiveTab('certificates')}
            style={{
              background: activeTab === 'certificates' ? 'linear-gradient(135deg, #d4880f, #e8a025)' : 'transparent',
              color: activeTab === 'certificates' ? '#0a0c0f' : '#94a3b8',
            }}
            className="px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 font-bold"
          >
            <Award className="w-4 h-4" />
            My Certificates ({certificates.length})
          </button>

          <button
            onClick={() => setActiveTab('bookmarks')}
            style={{
              background: activeTab === 'bookmarks' ? 'linear-gradient(135deg, #d4880f, #e8a025)' : 'transparent',
              color: activeTab === 'bookmarks' ? '#0a0c0f' : '#94a3b8',
            }}
            className="px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 font-bold"
          >
            <BookmarkIcon className="w-4 h-4" />
            Wishlist ({bookmarks.length})
          </button>

          <button
            onClick={() => setActiveTab('recommended')}
            style={{
              background: activeTab === 'recommended' ? 'linear-gradient(135deg, #d4880f, #e8a025)' : 'transparent',
              color: activeTab === 'recommended' ? '#0a0c0f' : '#94a3b8',
            }}
            className="px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 font-bold"
          >
            <GraduationCap className="w-4 h-4" />
            {user?.department_code || 'Dept'} Recommended
          </button>
        </div>

        {/* Tab 1: Registrations */}
        {activeTab === 'registrations' && (
          <div className="space-y-4">
            {registrations.length === 0 ? (
              <div
                style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)' }}
                className="rounded-3xl p-12 text-center"
              >
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="font-bold text-white text-base">No Event Registrations Yet</h3>
                <p className="text-xs text-slate-400 mt-1">Explore campus events and claim your seat today.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registrations.map((reg) => (
                  <div
                    key={reg.id}
                    style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)' }}
                    className="p-5 rounded-3xl shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          style={{
                            background: 'rgba(212,136,15,0.15)',
                            color: '#e8a025',
                            border: '1px solid rgba(212,136,15,0.3)',
                          }}
                          className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md"
                        >
                          Pass #{reg.id}
                        </span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            reg.status === 'confirmed'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {reg.status.toUpperCase()}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-base">
                        {reg.event?.title || 'Event'}
                      </h3>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>{reg.event?.event_date ? new Date(reg.event.event_date).toLocaleDateString() : 'TBD'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-teal-400" />
                          <span>{reg.event?.venue}</span>
                        </div>
                        {reg.team_name && (
                          <div className="flex items-center gap-2 font-semibold text-amber-300">
                            <span>Team: {reg.team_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div
                      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                      className="mt-5 pt-3.5 flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-500 text-[11px]">
                        Registered on {new Date(reg.registered_at).toLocaleDateString()}
                      </span>

                      {reg.status === 'confirmed' && (
                        <button
                          onClick={() => handleOpenCancelModal(reg)}
                          className="text-red-400 hover:text-red-300 font-semibold cursor-pointer text-xs transition-colors"
                        >
                          Cancel Seat
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Certificates */}
        {activeTab === 'certificates' && (() => {
          const winnerCerts = certificates.filter((c) =>
            ['winner', 'runner_up', 'second_runner_up', 'special_award'].includes(c.cert_type)
          );
          const participationCerts = certificates.filter(
            (c) => !['winner', 'runner_up', 'second_runner_up', 'special_award'].includes(c.cert_type)
          );

          if (certificates.length === 0) {
            return (
              <div
                style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)' }}
                className="rounded-3xl p-12 text-center"
              >
                <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="font-bold text-white text-base">No Certificates Issued Yet</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Certificates are automatically issued when attendance is recorded or when competition winners are declared.
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-8">
              {/* Official Hackathon Winner Awards Section */}
              {winnerCerts.length > 0 && (
                <div className="space-y-4">
                  {/* Celebratory Banner */}
                  <div
                    style={{
                      background: 'radial-gradient(ellipse at top left, rgba(245, 158, 11, 0.18), rgba(15, 17, 23, 0.95))',
                      border: '1px solid rgba(245, 158, 11, 0.35)',
                      boxShadow: '0 12px 30px rgba(245, 158, 11, 0.1)',
                    }}
                    className="p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                        <Trophy className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-white text-base sm:text-lg">
                            International Hackathon Laurels & Winner Awards
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {winnerCerts.length} Winner Credential{winnerCerts.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-xs text-amber-200/70 mt-0.5">
                          Conferred for exceptional competitive achievement, architectural execution, and technical excellence.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Winner Certificates Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {winnerCerts.map((cert) => {
                      const isFirst = cert.cert_type === 'winner';
                      const isSecond = cert.cert_type === 'runner_up';

                      return (
                        <div
                          key={cert.id}
                          style={{
                            background:
                              'radial-gradient(ellipse at top right, rgba(245, 158, 11, 0.12), #0e111a 60%)',
                            border: '1.5px solid rgba(245, 158, 11, 0.4)',
                            boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
                          }}
                          className="rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between group hover:border-amber-400 transition-all"
                        >
                          {/* Corner Glow */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 uppercase tracking-wider flex items-center gap-1 shadow-sm">
                                <Trophy className="w-3.5 h-3.5" />
                                {cert.rank_position || 'Grand Champion'}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                                {cert.certificate_number}
                              </span>
                            </div>

                            <h3 className="font-black text-white text-base leading-snug mt-2 group-hover:text-amber-300 transition-colors">
                              {cert.title}
                            </h3>
                            <p className="text-xs font-semibold text-slate-300 mt-1">
                              {cert.event_title}
                            </p>

                            {/* Prize & Team Tags */}
                            <div className="flex flex-wrap items-center gap-2 mt-3.5 text-xs">
                              {cert.prize && (
                                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                                  ★ {formatPrizeRupee(cert.prize)}
                                </span>
                              )}
                              {cert.team_name && (
                                <span className="font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                                  Team: {cert.team_name}
                                </span>
                              )}
                              {cert.track && (
                                <span className="text-slate-400 bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-700/60 text-[11px]">
                                  {cert.track}
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
                            className="mt-6 pt-3.5 flex items-center justify-between"
                          >
                            <span className="text-[10px] text-slate-400 font-mono">
                              Issued {new Date(cert.issue_date).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => setSelectedCert(cert)}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 flex items-center gap-1.5 shadow-md shadow-amber-500/20 hover:scale-[1.02] cursor-pointer transition-all"
                            >
                              <Trophy className="w-3.5 h-3.5" />
                              View Official Certificate
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Participation & Delegate Certificates */}
              {participationCerts.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-sky-400" />
                    <h4 className="font-bold text-slate-200 text-sm uppercase tracking-wider">
                      Participation & Event Certificates ({participationCerts.length})
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {participationCerts.map((cert) => (
                      <div
                        key={cert.id}
                        style={{
                          background: '#0f1117',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                        className="rounded-3xl p-5 shadow-xl flex flex-col justify-between hover:border-slate-600 transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/5 text-slate-300">
                              {cert.certificate_number}
                            </span>
                            <span className="text-[10px] font-semibold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded border border-sky-400/20">
                              Participant
                            </span>
                          </div>
                          <h3 className="font-bold text-white text-sm mt-1">
                            {cert.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">{cert.event_title}</p>
                        </div>

                        <div
                          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                          className="mt-5 pt-3 flex items-center justify-between"
                        >
                          <span className="text-[10px] text-slate-500">
                            Issued {new Date(cert.issue_date).toLocaleDateString()}
                          </span>
                          <button
                            onClick={() => setSelectedCert(cert)}
                            className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            View & Verify
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Tab 3: Bookmarks */}

        {activeTab === 'bookmarks' && (
          <div className="space-y-4">
            {bookmarks.length === 0 ? (
              <div
                style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)' }}
                className="rounded-3xl p-12 text-center"
              >
                <BookmarkIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="font-bold text-white text-base">Your Wishlist is Empty</h3>
                <p className="text-xs text-slate-400 mt-1">Bookmark events from the discovery page to track them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)' }}
                    className="p-5 rounded-3xl shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <span
                        style={{
                          background: 'rgba(20,184,166,0.15)',
                          color: '#2dd4bf',
                          border: '1px solid rgba(20,184,166,0.25)',
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      >
                        {bm.event?.department_code || 'INST'}
                      </span>
                      <h3 className="font-bold text-white text-sm mt-2 line-clamp-1">
                        {bm.event?.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{bm.event?.description}</p>
                    </div>

                    <div
                      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                      className="mt-4 pt-3 flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-teal-400">
                        {bm.event?.available_seats} seats left
                      </span>
                      <button
                        onClick={() => setSelectedEventForRegister(bm.event)}
                        style={{
                          background: 'linear-gradient(135deg, #d4880f, #e8a025)',
                          color: '#0a0c0f',
                        }}
                        className="px-3.5 py-1.5 font-bold rounded-lg text-xs cursor-pointer hover:brightness-110 transition-all"
                      >
                        Register
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Recommended */}
        {activeTab === 'recommended' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommended.map((ev) => (
              <div
                key={ev.id}
                style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)' }}
                className="p-5 rounded-3xl shadow-lg flex flex-col justify-between"
              >
                <div>
                  <span
                    style={{
                      background: 'rgba(212,136,15,0.15)',
                      color: '#e8a025',
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                  >
                    {ev.category_name}
                  </span>
                  <h3 className="font-bold text-white text-base mt-2">{ev.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ev.description}</p>
                </div>
                <div
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  className="mt-4 pt-3 flex items-center justify-between"
                >
                  <span className="text-xs text-slate-500">{new Date(ev.event_date).toLocaleDateString()}</span>
                  <button
                    onClick={() => setSelectedEventForRegister(ev)}
                    style={{
                      background: 'linear-gradient(135deg, #d4880f, #e8a025)',
                      color: '#0a0c0f',
                    }}
                    className="px-3.5 py-1.5 font-bold rounded-lg text-xs cursor-pointer hover:brightness-110 transition-all"
                  >
                    Register
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Official International Hackathon & Event Certificate Modal */}
      {selectedCert && (
        <HackathonCertificateModal
          certificate={selectedCert}
          isOpen={!!selectedCert}
          onClose={() => setSelectedCert(null)}
        />
      )}


      <RegistrationModal
        event={selectedEventForRegister}
        isOpen={!!selectedEventForRegister}
        onClose={() => setSelectedEventForRegister(null)}
        onSuccess={loadDashboardData}
      />

      {/* Custom In-App Confirmation Modal for Registration Cancellation */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        title="Cancel Registration?"
        message="Are you sure you want to cancel this registration? Your seat will be released."
        confirmText="Yes, Cancel Registration"
        cancelText="Keep Registration"
        confirmVariant="danger"
        isLoading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          if (!cancelling) {
            setCancelModalOpen(false);
            setSelectedCancelReg(null);
          }
        }}
      />
    </div>
  );
}
