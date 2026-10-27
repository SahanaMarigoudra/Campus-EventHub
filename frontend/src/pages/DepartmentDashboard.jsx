import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Layers,
  Calendar,
  Users,
  Plus,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Trophy,
  Award,
  QrCode,
  Search,
  Filter,
  Loader2,
  FileText,
  Sparkles,
  GraduationCap,
  BookOpen,
  Mail,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchDepartmentDashboard,
  createEvent,
  fetchEventAttendance,
  markAttendance,
  qrCheckin,
  generateCertificates,
  generateWinnerCertificates,

  exportRegistrationsCSV,
  publishEventResults,
  fetchCategories,
} from '../services/api';


export default function DepartmentDashboard() {
  const { id } = useParams();
  const { user } = useAuth();
  const deptId = id || user?.department_id || 1;

  const [dashboardData, setDashboardData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events'); // events, attendance, results, students
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('ALL');

  // Event Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category_id: 1,
    subcategory: '',
    event_date: '',
    start_time: '10:00 AM',
    end_time: '04:00 PM',
    venue: '',
    event_mode: 'Offline',
    capacity: 60,
    participation_type: 'individual',
    max_team_size: 1,
    eligibility_criteria: 'All enrolled students',
    rules_guidelines: '',
    prizes_rewards: '',
    status: 'pending_approval',
  });
  const [creating, setCreating] = useState(false);

  // Attendance Module State
  const [selectedEventForAttendance, setSelectedEventForAttendance] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [qrInput, setQrInput] = useState('');
  const [qrMessage, setQrMessage] = useState('');
  const [certMessage, setCertMessage] = useState('');

  // Results Publishing State
  const [resultForm, setResultForm] = useState({
    eventId: null,
    summary: '',
    winner1Name: '',
    winner1Team: '',
    winner1Dept: '',
    winner1Prize: '',
    winner2Name: '',
    winner2Team: '',
    winner2Dept: '',
    winner2Prize: '',
    winner3Name: '',
    winner3Team: '',
    winner3Dept: '',
    winner3Prize: '',
  });


  useEffect(() => {
    loadDepartment();
    fetchCategories().then((r) => {
      if (r.success) setCategories(r.categories || []);
    });
  }, [deptId]);

  const loadDepartment = () => {
    setLoading(true);
    fetchDepartmentDashboard(deptId)
      .then((res) => {
        if (res.success) {
          setDashboardData(res);
          if (res.events && res.events.length > 0 && !selectedEventForAttendance) {
            setSelectedEventForAttendance(res.events[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedEventForAttendance) {
      loadAttendance(selectedEventForAttendance.id);
    }
  }, [selectedEventForAttendance]);

  const loadAttendance = (eventId) => {
    fetchEventAttendance(eventId)
      .then((res) => {
        if (res.success) setAttendanceData(res);
      })
      .catch(() => setAttendanceData(null));
  };

  const handleExportStudentsCSV = () => {
    const studentsToExport = dashboardData?.students || [];
    if (!studentsToExport.length) return;
    const headers = [
      'Student ID',
      'Full Name',
      'Email',
      'Roll Number',
      'Department',
      'Course / Program',
      'Semester',
      'Registered Events',
      'Attended Events',
      'Certificates Awarded',
      'Registration Date',
    ];
    const rows = studentsToExport.map((s) => [
      s.id,
      `"${(s.full_name || s.name || '').replace(/"/g, '""')}"`,
      `"${(s.email || '').replace(/"/g, '""')}"`,
      `"${(s.roll_number || '').replace(/"/g, '""')}"`,
      `"${(dashboardData?.department?.name || '').replace(/"/g, '""')}"`,
      `"${(s.program || '').replace(/"/g, '""')}"`,
      s.semester || '',
      s.stats?.registrations_count || 0,
      s.stats?.attended_count || 0,
      s.stats?.certificates_count || 0,
      s.created_at || '',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${dashboardData?.department?.code || 'Department'}_Enrolled_Students.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await createEvent({
        ...createForm,
        department_id: deptId,
      });
      if (res.success) {
        setShowCreateModal(false);
        loadDepartment();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to propose event.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleAttendance = async (userId, currentStatus) => {
    if (!selectedEventForAttendance) return;
    try {
      await markAttendance(selectedEventForAttendance.id, {
        user_id: userId,
        is_present: !currentStatus,
      });
      loadAttendance(selectedEventForAttendance.id);
    } catch (err) {
      alert('Could not update attendance.');
    }
  };

  const handleQrCheckinSubmit = async (e) => {
    e.preventDefault();
    if (!qrInput.trim() || !selectedEventForAttendance) return;
    try {
      const res = await qrCheckin(selectedEventForAttendance.id, qrInput.trim());
      if (res.success) {
        setQrMessage(`✓ Verified: ${res.participant?.student_name}`);
        setQrInput('');
        loadAttendance(selectedEventForAttendance.id);
      }
    } catch (err) {
      setQrMessage(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleIssueCertificates = async () => {
    if (!selectedEventForAttendance) return;
    if (!window.confirm('Issue participation certificates to all verified present attendees?')) return;
    try {
      const res = await generateCertificates(selectedEventForAttendance.id);
      if (res.success) {
        setCertMessage(res.message);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not issue certificates.');
    }
  };

  const handleIssueWinnerCertificates = async () => {
    if (!selectedEventForAttendance) return;
    if (!window.confirm(`Generate and issue official international hackathon winner certificates for '${selectedEventForAttendance.title}'?`)) return;
    try {
      const res = await generateWinnerCertificates(selectedEventForAttendance.id);
      if (res.success) {
        setCertMessage(`🏆 ${res.message}`);
        alert(`🏆 ${res.message}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not issue winner certificates. Make sure results/winners are published first.');
    }
  };

  const handlePublishResults = async (e) => {
    e.preventDefault();
    if (!resultForm.eventId) return;
    try {
      const winners = [];
      if (resultForm.winner1Name) {
        winners.push({
          position: '1st Place (Grand Champion)',
          name: resultForm.winner1Name,
          team: resultForm.winner1Team,
          department: resultForm.winner1Dept,
          prize: resultForm.winner1Prize,
        });
      }
      if (resultForm.winner2Name) {
        winners.push({
          position: '2nd Place (1st Runner-Up)',
          name: resultForm.winner2Name,
          team: resultForm.winner2Team,
          department: resultForm.winner2Dept,
          prize: resultForm.winner2Prize,
        });
      }
      if (resultForm.winner3Name) {
        winners.push({
          position: '3rd Place (2nd Runner-Up)',
          name: resultForm.winner3Name,
          team: resultForm.winner3Team,
          department: resultForm.winner3Dept,
          prize: resultForm.winner3Prize,
        });
      }

      const res = await publishEventResults(resultForm.eventId, {
        summary: resultForm.summary,
        winners,
      });
      if (res.success) {
        alert('Results and winners published successfully! 🏆 Official Hackathon Winner Certificates have been generated for the winners.');
        loadDepartment();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not publish results.');
    }
  };


  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{ background: '#0a0c0f' }}>
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const dept = dashboardData?.department;
  const stats = dashboardData?.stats;

  return (
    <div style={{ background: '#0a0c0f', minHeight: 'calc(100vh - 64px)', color: '#e8eaf0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 40px' }} className="space-y-7">
        
        {/* Department Banner & Actions */}
        <div
          style={{
            background: 'linear-gradient(145deg, #131722 0%, #0d1017 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            borderRadius: '24px',
            padding: '32px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span
                style={{
                  background: 'rgba(212,136,15,0.15)',
                  color: '#e8a025',
                  border: '1px solid rgba(212,136,15,0.3)',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Department Coordinator Portal
              </span>
              <span
                style={{
                  background: 'rgba(20,184,166,0.15)',
                  color: '#2dd4bf',
                  border: '1px solid rgba(20,184,166,0.25)',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                }}
              >
                {dept?.code}
              </span>
            </div>
            <h1
              style={{
                fontFamily: 'Outfit, system-ui, sans-serif',
                fontSize: '28px',
                fontWeight: 700,
                color: '#ffffff',
                lineHeight: 1.25,
                margin: '0 0 8px 0',
              }}
            >
              {dept?.name}
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 10px 0' }}>
              {dept?.description}
            </p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Coordinator:</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{dept?.coordinator_name}</span>
              <span>({dept?.coordinator_email})</span>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: 'linear-gradient(135deg, #d4880f 0%, #e8a025 100%)',
                color: '#0a0c0f',
                fontWeight: 700,
                fontSize: '13px',
                padding: '11px 20px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(212,136,15,0.35)',
                transition: 'all 0.2s',
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              Propose New Event
            </button>
            <button
              onClick={() => exportRegistrationsCSV({ department_id: deptId })}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0',
                fontWeight: 600,
                fontSize: '13px',
                padding: '11px 18px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background 0.2s',
              }}
            >
              <Download size={15} />
              Export CSV
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div
            style={{
              background: '#0f1117',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              padding: '22px 24px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total Events
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: 'Outfit, system-ui, sans-serif',
                fontSize: '28px',
                fontWeight: 700,
                color: '#ffffff',
                margin: '6px 0 4px 0',
              }}
            >
              {stats?.total_events || 0}
            </span>
            <span style={{ fontSize: '12px', color: '#14b8a6', fontWeight: 500 }}>
              {stats?.published_events || 0} active published
            </span>
          </div>

          <div
            style={{
              background: '#0f1117',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              padding: '22px 24px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Confirmed Registrations
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: 'Outfit, system-ui, sans-serif',
                fontSize: '28px',
                fontWeight: 700,
                color: '#e8a025',
                margin: '6px 0 4px 0',
              }}
            >
              {stats?.confirmed_registrations || 0}
            </span>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
              Across department activities
            </span>
          </div>

          <div
            style={{
              background: '#0f1117',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              padding: '22px 24px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Pending Approvals
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: 'Outfit, system-ui, sans-serif',
                fontSize: '28px',
                fontWeight: 700,
                color: '#fbbf24',
                margin: '6px 0 4px 0',
              }}
            >
              {stats?.pending_approval || 0}
            </span>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
              Awaiting faculty review
            </span>
          </div>

          <div
            style={{
              background: '#0f1117',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              padding: '22px 24px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Completed Events
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: 'Outfit, system-ui, sans-serif',
                fontSize: '28px',
                fontWeight: 700,
                color: '#2dd4bf',
                margin: '6px 0 4px 0',
              }}
            >
              {stats?.completed_events || 0}
            </span>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
              Results & certificates declared
            </span>
          </div>

          <div
            style={{
              background: '#0f1117',
              border: '1px solid rgba(56, 189, 248, 0.15)',
              borderRadius: '16px',
              padding: '22px 24px',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Enrolled Students
            </span>
            <span
              style={{
                display: 'block',
                fontFamily: 'Outfit, system-ui, sans-serif',
                fontSize: '28px',
                fontWeight: 700,
                color: '#38bdf8',
                margin: '6px 0 4px 0',
              }}
            >
              {stats?.total_students || 0}
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
              Across {dashboardData?.programs?.length || 0} course programs
            </span>
          </div>
        </div>

        {/* Tab Headers */}
        <div
          style={{
            background: '#0f1117',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '16px',
            padding: '8px',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setActiveTab('events')}
            style={{
              background: activeTab === 'events' ? 'linear-gradient(135deg, #d4880f, #e8a025)' : 'transparent',
              color: activeTab === 'events' ? '#0a0c0f' : '#94a3b8',
              fontWeight: 700,
              fontSize: '12px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.18s',
            }}
          >
            <Calendar size={15} />
            Manage Department Events ({dashboardData?.events?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('students')}
            style={{
              background: activeTab === 'students' ? 'linear-gradient(135deg, #0284c7, #38bdf8)' : 'transparent',
              color: activeTab === 'students' ? '#0a0c0f' : '#94a3b8',
              fontWeight: 700,
              fontSize: '12px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.18s',
            }}
          >
            <Users size={15} />
            Enrolled Students & Courses ({dashboardData?.students?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            style={{
              background: activeTab === 'attendance' ? 'linear-gradient(135deg, #d4880f, #e8a025)' : 'transparent',
              color: activeTab === 'attendance' ? '#0a0c0f' : '#94a3b8',
              fontWeight: 700,
              fontSize: '12px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.18s',
            }}
          >
            <CheckCircle2 size={15} />
            Attendance & QR Check-In
          </button>

          <button
            onClick={() => setActiveTab('results')}
            style={{
              background: activeTab === 'results' ? 'linear-gradient(135deg, #d4880f, #e8a025)' : 'transparent',
              color: activeTab === 'results' ? '#0a0c0f' : '#94a3b8',
              fontWeight: 700,
              fontSize: '12px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.18s',
            }}
          >
            <Trophy size={15} />
            Publish Winners & Results
          </button>
        </div>

        {/* Tab 1: Manage Events */}
        {activeTab === 'events' && (
          <div
            style={{
              background: '#0f1117',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 16px 36px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.015)',
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>
                Department Proposals & Active Events
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Showing {dashboardData?.events?.length || 0} events
              </span>
            </div>

            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <th style={{ padding: '14px 24px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Event Title</th>
                    <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Category</th>
                    <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Date & Venue</th>
                    <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Capacity</th>
                    <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Status</th>
                    <th style={{ padding: '14px 24px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData?.events?.map((ev) => (
                    <tr
                      key={ev.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                    >
                      <td style={{ padding: '16px 24px', fontWeight: 600, color: '#f1f5f9', maxWidth: '300px' }}>
                        {ev.title}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#14b8a6', fontWeight: 500 }}>
                        {ev.category_name}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#94a3b8' }}>
                        {new Date(ev.event_date).toLocaleDateString()} • {ev.venue}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontWeight: 700, color: '#e8a025' }}>{ev.confirmed_count}</span>
                        <span style={{ color: '#64748b' }}> / {ev.capacity}</span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            background:
                              ev.status === 'published'
                                ? 'rgba(16,185,129,0.15)'
                                : ev.status === 'completed'
                                ? 'rgba(168,85,247,0.15)'
                                : 'rgba(245,158,11,0.15)',
                            color:
                              ev.status === 'published'
                                ? '#34d399'
                                : ev.status === 'completed'
                                ? '#c084fc'
                                : '#fbbf24',
                            border: `1px solid ${
                              ev.status === 'published'
                                ? 'rgba(16,185,129,0.3)'
                                : ev.status === 'completed'
                                ? 'rgba(168,85,247,0.3)'
                                : 'rgba(245,158,11,0.3)'
                            }`,
                          }}
                        >
                          {ev.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                            background:
                              ev.approval_status === 'approved'
                                ? 'rgba(16,185,129,0.15)'
                                : ev.approval_status === 'rejected'
                                ? 'rgba(239,68,68,0.15)'
                                : 'rgba(245,158,11,0.15)',
                            color:
                              ev.approval_status === 'approved'
                                ? '#34d399'
                                : ev.approval_status === 'rejected'
                                ? '#f87171'
                                : '#fbbf24',
                            border: `1px solid ${
                              ev.approval_status === 'approved'
                                ? 'rgba(16,185,129,0.3)'
                                : ev.approval_status === 'rejected'
                                ? 'rgba(239,68,68,0.3)'
                                : 'rgba(245,158,11,0.3)'
                            }`,
                          }}
                        >
                          {ev.approval_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Attendance & QR Checkin */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div
                style={{
                  background: '#0f1117',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '20px',
                  padding: '24px',
                }}
                className="space-y-4"
              >
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
                  Select Event for Attendance:
                </label>
                <select
                  value={selectedEventForAttendance?.id || ''}
                  onChange={(e) => {
                    const ev = dashboardData?.events?.find((x) => x.id === parseInt(e.target.value));
                    setSelectedEventForAttendance(ev);
                  }}
                  style={{
                    width: '100%',
                    fontSize: '13px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none',
                  }}
                >
                  {dashboardData?.events?.map((ev) => (
                    <option key={ev.id} value={ev.id} style={{ background: '#0f1117' }}>
                      {ev.title} ({new Date(ev.event_date).toLocaleDateString()})
                    </option>
                  ))}
                </select>

                {attendanceData && (
                  <div
                    style={{
                      background: 'rgba(20,184,166,0.06)',
                      border: '1px solid rgba(20,184,166,0.15)',
                      borderRadius: '14px',
                      padding: '16px',
                    }}
                    className="space-y-2 text-xs"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Registered:</span>
                      <span style={{ fontWeight: 700, color: '#fff' }}>{attendanceData.stats?.total_registered}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Present Attendees:</span>
                      <span style={{ fontWeight: 700, color: '#2dd4bf' }}>{attendanceData.stats?.present_count}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Turnout Rate:</span>
                      <span style={{ fontWeight: 700, color: '#e8a025' }}>{attendanceData.stats?.attendance_rate}%</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleIssueCertificates}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #d4880f 0%, #e8a025 100%)',
                    color: '#0a0c0f',
                    fontWeight: 700,
                    fontSize: '13px',
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <Award size={16} />
                  Issue Attendance Certificates
                </button>

                <button
                  onClick={handleIssueWinnerCertificates}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#0a0c0f',
                    fontWeight: 800,
                    fontSize: '13px',
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    boxShadow: '0 4px 15px rgba(245,158,11,0.25)',
                  }}
                >
                  <Trophy size={16} />
                  Issue Hackathon Winner Certificates 🏆
                </button>
                {certMessage && <p style={{ fontSize: '12px', color: '#2dd4bf', fontWeight: 600, marginTop: '8px' }}>{certMessage}</p>}
              </div>


              {/* Fast Roll Number / QR Check-in */}
              <div
                style={{
                  background: '#0f1117',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '20px',
                  padding: '24px',
                }}
              >
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 6px 0' }}>
                  <QrCode size={18} color="#e8a025" />
                  Quick Attendee Verification & Check-In
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 18px 0' }}>
                  Enter student roll number or registration ID to immediately mark presence.
                </p>

                <form onSubmit={handleQrCheckinSubmit} style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    required
                    placeholder="Enter Roll No (e.g. MCA-2026-001) or Registration ID..."
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '11px 16px',
                      fontSize: '13px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #d4880f, #e8a025)',
                      color: '#0a0c0f',
                      fontWeight: 700,
                      fontSize: '13px',
                      padding: '11px 20px',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    Verify & Check-In
                  </button>
                </form>

                {qrMessage && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '12px 16px',
                      background: 'rgba(20,184,166,0.1)',
                      border: '1px solid rgba(20,184,166,0.25)',
                      color: '#2dd4bf',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {qrMessage}
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Roster Table */}
            <div
              style={{
                background: '#0f1117',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 16px 36px rgba(0,0,0,0.4)',
              }}
            >
              <div
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(255,255,255,0.015)',
                  padding: '18px 24px',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#f1f5f9',
                }}
              >
                Registered Participants Roster
              </div>
              <div style={{ overflowX: 'auto', width: '100%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <th style={{ padding: '14px 24px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px' }}>Roll No</th>
                      <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px' }}>Student Name</th>
                      <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px' }}>Email</th>
                      <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px' }}>Dept</th>
                      <th style={{ padding: '14px 20px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px' }}>Presence Status</th>
                      <th style={{ padding: '14px 24px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData?.participants?.map((p) => (
                      <tr key={p.registration_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '16px 24px', fontFamily: 'monospace', fontWeight: 700, color: '#e8a025' }}>{p.roll_number}</td>
                        <td style={{ padding: '16px 20px', fontWeight: 600, color: '#f1f5f9' }}>{p.student_name}</td>
                        <td style={{ padding: '16px 20px', color: '#94a3b8' }}>{p.email}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                            {p.department_code}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: p.is_present ? 'rgba(20,184,166,0.15)' : 'rgba(100,116,139,0.15)',
                              color: p.is_present ? '#2dd4bf' : '#94a3b8',
                              border: `1px solid ${p.is_present ? 'rgba(20,184,166,0.3)' : 'rgba(100,116,139,0.2)'}`,
                            }}
                          >
                            {p.is_present ? 'PRESENT' : 'ABSENT'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <button
                            onClick={() => handleToggleAttendance(p.user_id, p.is_present)}
                            style={{
                              background: p.is_present ? 'rgba(239,68,68,0.15)' : 'rgba(20,184,166,0.15)',
                              color: p.is_present ? '#f87171' : '#2dd4bf',
                              border: p.is_present ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(20,184,166,0.3)',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {p.is_present ? 'Mark Absent' : 'Mark Present'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Publish Results */}
        {activeTab === 'results' && (
          <div
            style={{
              background: '#0f1117',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '680px',
              margin: '0 auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <h3
              style={{
                fontFamily: 'Outfit, system-ui, sans-serif',
                fontSize: '20px',
                fontWeight: 700,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                margin: '0 0 6px 0',
              }}
            >
              <Trophy size={20} color="#e8a025" />
              Publish Official Event Results & Winners
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 24px 0' }}>
              Announce winners and write the event conclusion summary for the student portal.
            </p>

            <form onSubmit={handlePublishResults} className="space-y-4" style={{ fontSize: '13px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>Select Event *</label>
                <select
                  required
                  value={resultForm.eventId || ''}
                  onChange={(e) => setResultForm({ ...resultForm, eventId: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none',
                  }}
                >
                  <option value="" style={{ background: '#0f1117' }}>Choose event...</option>
                  {dashboardData?.events?.map((ev) => (
                    <option key={ev.id} value={ev.id} style={{ background: '#0f1117' }}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>Event Summary *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Summarize the competition highlights, turnout, and key moments..."
                  value={resultForm.summary}
                  onChange={(e) => setResultForm({ ...resultForm, summary: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              {/* 1st Place */}
              <div
                style={{
                  background: 'rgba(212,136,15,0.08)',
                  border: '1px solid rgba(212,136,15,0.25)',
                  borderRadius: '16px',
                  padding: '18px',
                }}
                className="space-y-3"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#fbbf24', fontSize: '13px' }}>
                    <Trophy size={16} color="#e8a025" />
                    1st Place (Grand Champion)
                  </span>
                  <span style={{ fontSize: '10px', color: '#fbbf24', background: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    GOLD CREDENTIAL
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Winner / Student Name"
                    value={resultForm.winner1Name}
                    onChange={(e) => setResultForm({ ...resultForm, winner1Name: e.target.value })}
                    style={{
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Team Name (e.g. CyberSentinels)"
                    value={resultForm.winner1Team}
                    onChange={(e) => setResultForm({ ...resultForm, winner1Team: e.target.value })}
                    style={{
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Dept (e.g. MCA)"
                    value={resultForm.winner1Dept}
                    onChange={(e) => setResultForm({ ...resultForm, winner1Dept: e.target.value })}
                    style={{
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Prize (e.g. ₹1,00,000 + Trophy)"
                    value={resultForm.winner1Prize}
                    onChange={(e) => setResultForm({ ...resultForm, winner1Prize: e.target.value })}
                    style={{
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* 2nd Place */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  padding: '18px',
                }}
                className="space-y-3"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, color: '#cbd5e1', fontSize: '13px' }}>
                    2nd Place (1st Runner-Up)
                  </span>
                  <span style={{ fontSize: '10px', color: '#cbd5e1', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    SILVER CREDENTIAL
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Winner / Student Name"
                    value={resultForm.winner2Name}
                    onChange={(e) => setResultForm({ ...resultForm, winner2Name: e.target.value })}
                    style={{
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Team Name (e.g. KernelSquad)"
                    value={resultForm.winner2Team}
                    onChange={(e) => setResultForm({ ...resultForm, winner2Team: e.target.value })}
                    style={{
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Dept (e.g. B.Tech)"
                    value={resultForm.winner2Dept}
                    onChange={(e) => setResultForm({ ...resultForm, winner2Dept: e.target.value })}
                    style={{
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Prize (e.g. ₹50,000 + Tech Kit)"
                    value={resultForm.winner2Prize}
                    onChange={(e) => setResultForm({ ...resultForm, winner2Prize: e.target.value })}
                    style={{
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* 3rd Place */}
              <div
                style={{
                  background: 'rgba(217,119,6,0.06)',
                  border: '1px solid rgba(217,119,6,0.2)',
                  borderRadius: '16px',
                  padding: '18px',
                }}
                className="space-y-3"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 800, color: '#f59e0b', fontSize: '13px' }}>
                    3rd Place (2nd Runner-Up)
                  </span>
                  <span style={{ fontSize: '10px', color: '#f59e0b', background: 'rgba(217,119,6,0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    BRONZE CREDENTIAL
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Winner / Student Name"
                    value={resultForm.winner3Name}
                    onChange={(e) => setResultForm({ ...resultForm, winner3Name: e.target.value })}
                    style={{
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Team Name (e.g. NeuralExploiters)"
                    value={resultForm.winner3Team}
                    onChange={(e) => setResultForm({ ...resultForm, winner3Team: e.target.value })}
                    style={{
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Dept (e.g. M.Tech AI)"
                    value={resultForm.winner3Dept}
                    onChange={(e) => setResultForm({ ...resultForm, winner3Dept: e.target.value })}
                    style={{
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Prize (e.g. ₹25,000 + Tech Prize)"
                    value={resultForm.winner3Prize}
                    onChange={(e) => setResultForm({ ...resultForm, winner3Prize: e.target.value })}
                    style={{
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      fontSize: '12px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Informational Credential Banner */}
              <div
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.25)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div style={{ color: '#10b981', flexShrink: 0 }}>
                  <Trophy size={18} />
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#a7f3d0' }}>
                  <strong>International Hackathon Credential Engine:</strong> Official winner certificates with cryptographic verification hash, rank badges, and public links are automatically generated for all declared winners.
                </p>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #d4880f 0%, #e8a025 100%)',
                  color: '#0a0c0f',
                  fontWeight: 800,
                  fontSize: '14px',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '8px',
                  boxShadow: '0 8px 25px rgba(212,136,15,0.25)',
                }}
              >
                Publish Official Results & Generate Winner Certificates 🏆
              </button>
            </form>

          </div>
        )}

        {/* Tab 4: Registered Students & Courses */}
        {activeTab === 'students' && (
          <div
            style={{
              background: '#0f1117',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              padding: '24px',
            }}
          >
            {/* Header with Title & Export */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div>
                <h3
                  style={{
                    fontFamily: 'Outfit, system-ui, sans-serif',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#ffffff',
                    margin: '0 0 6px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <GraduationCap size={20} color="#38bdf8" />
                  Department Student Roster & Course Allocation
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, maxWidth: '720px' }}>
                  Students enrolled under <strong>{dept?.name} ({dept?.code})</strong> across degree programs and courses. Filter by course specialization, search by name/email/roll number, and review individual event activity.
                </p>
              </div>

              <button
                onClick={handleExportStudentsCSV}
                disabled={!dashboardData?.students?.length}
                style={{
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  fontWeight: 600,
                  fontSize: '12px',
                  padding: '9px 16px',
                  borderRadius: '10px',
                  cursor: dashboardData?.students?.length ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  opacity: dashboardData?.students?.length ? 1 : 0.5,
                }}
              >
                <Download size={14} />
                Export Student Roster CSV
              </button>
            </div>

            {/* Course Filter Pills */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Filter by Course / Program
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(() => {
                  const allStudents = dashboardData?.students || [];
                  const availablePrograms = Array.from(new Set([
                    ...(dashboardData?.programs || []),
                    ...allStudents.map((s) => s.program).filter(Boolean),
                  ]));

                  return (
                    <>
                      <button
                        onClick={() => setSelectedCourseFilter('ALL')}
                        style={{
                          background: selectedCourseFilter === 'ALL' ? '#38bdf8' : 'rgba(255,255,255,0.04)',
                          color: selectedCourseFilter === 'ALL' ? '#0a0c0f' : '#94a3b8',
                          fontWeight: 700,
                          fontSize: '12px',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: selectedCourseFilter === 'ALL' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s',
                        }}
                      >
                        All Programs ({allStudents.length})
                      </button>
                      {availablePrograms.map((prog) => {
                        const count = allStudents.filter((s) => s.program === prog).length;
                        const isSelected = selectedCourseFilter === prog;
                        return (
                          <button
                            key={prog}
                            onClick={() => setSelectedCourseFilter(prog)}
                            style={{
                              background: isSelected ? '#38bdf8' : 'rgba(255,255,255,0.04)',
                              color: isSelected ? '#0a0c0f' : '#94a3b8',
                              fontWeight: 700,
                              fontSize: '12px',
                              padding: '6px 14px',
                              borderRadius: '20px',
                              border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.08)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.15s',
                            }}
                          >
                            <BookOpen size={12} />
                            {prog} ({count})
                          </button>
                        );
                      })}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Search Bar & Roster Metrics */}
            {(() => {
              const allStudents = dashboardData?.students || [];
              const filtered = allStudents.filter((s) => {
                const matchesCourse = selectedCourseFilter === 'ALL' || s.program === selectedCourseFilter;
                if (!matchesCourse) return false;
                if (!studentSearch.trim()) return true;
                const query = studentSearch.toLowerCase();
                return (
                  (s.full_name || s.name || '').toLowerCase().includes(query) ||
                  (s.email || '').toLowerCase().includes(query) ||
                  (s.roll_number || '').toLowerCase().includes(query) ||
                  (s.program || '').toLowerCase().includes(query)
                );
              });

              const totalRegs = filtered.reduce((acc, s) => acc + (s.stats?.registrations_count || 0), 0);
              const totalAttended = filtered.reduce((acc, s) => acc + (s.stats?.attended_count || 0), 0);
              const totalCerts = filtered.reduce((acc, s) => acc + (s.stats?.certificates_count || 0), 0);

              return (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
                      <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                      <input
                        type="text"
                        placeholder="Search student name, email, roll no..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px 10px 38px',
                          borderRadius: '12px',
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#fff',
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      />
                    </div>

                    {/* Quick Stats Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '12px', color: '#cbd5e1' }}>
                        Showing <strong style={{ color: '#fff' }}>{filtered.length}</strong> of {allStudents.length} Students
                      </div>
                      <div style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(232, 160, 37, 0.08)', border: '1px solid rgba(232, 160, 37, 0.2)', fontSize: '12px', color: '#e8a025' }}>
                        <strong>{totalRegs}</strong> Event Registrations
                      </div>
                      <div style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(45, 212, 191, 0.08)', border: '1px solid rgba(45, 212, 191, 0.2)', fontSize: '12px', color: '#2dd4bf' }}>
                        <strong>{totalAttended}</strong> Attended
                      </div>
                      <div style={{ padding: '6px 12px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '12px', color: '#38bdf8' }}>
                        <strong>{totalCerts}</strong> Certificates
                      </div>
                    </div>
                  </div>

                  {/* Student Table */}
                  {filtered.length === 0 ? (
                    <div
                      style={{
                        padding: '48px 24px',
                        textAlign: 'center',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '14px',
                        border: '1px dashed rgba(255,255,255,0.1)',
                      }}
                    >
                      <Users size={36} color="#64748b" style={{ margin: '0 auto 12px auto' }} />
                      <h4 style={{ color: '#ffffff', fontSize: '15px', fontWeight: 600, margin: '0 0 6px 0' }}>
                        No Students Found
                      </h4>
                      <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, maxWidth: '460px', marginInline: 'auto' }}>
                        {allStudents.length === 0
                          ? `No students have registered under ${dept?.name || 'this department'} yet. Once students register choosing ${dept?.code || 'this department'}'s courses, they will automatically appear here.`
                          : "No students match your current course filter or search keywords. Try clearing the search or choosing 'All Programs'."}
                      </p>
                      {allStudents.length > 0 && (
                        <button
                          onClick={() => { setSelectedCourseFilter('ALL'); setStudentSearch(''); }}
                          style={{
                            marginTop: '16px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#e2e8f0',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <th style={{ padding: '12px 14px' }}>Student</th>
                            <th style={{ padding: '12px 14px' }}>Roll Number</th>
                            <th style={{ padding: '12px 14px' }}>Course / Program</th>
                            <th style={{ padding: '12px 14px', textAlign: 'center' }}>Event Activity</th>
                            <th style={{ padding: '12px 14px', textAlign: 'center' }}>Attended</th>
                            <th style={{ padding: '12px 14px', textAlign: 'center' }}>Certificates</th>
                            <th style={{ padding: '12px 14px', textAlign: 'right' }}>Registered On</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((student) => {
                            const displayName = student.full_name || student.name || 'Student';
                            const initials = displayName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase();

                            return (
                              <tr
                                key={student.id}
                                style={{
                                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                                  transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                              >
                                <td style={{ padding: '14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div
                                      style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(129, 140, 248, 0.2))',
                                        border: '1px solid rgba(56, 189, 248, 0.3)',
                                        color: '#38bdf8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 700,
                                        fontSize: '13px',
                                        flexShrink: 0,
                                      }}
                                    >
                                      {initials}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '13px' }}>
                                        {displayName}
                                      </div>
                                      <div style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Mail size={11} color="#64748b" />
                                        {student.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                <td style={{ padding: '14px' }}>
                                  <span
                                    style={{
                                      fontFamily: 'monospace',
                                      fontSize: '12px',
                                      color: '#cbd5e1',
                                      background: 'rgba(255,255,255,0.04)',
                                      padding: '3px 8px',
                                      borderRadius: '6px',
                                      border: '1px solid rgba(255,255,255,0.08)',
                                    }}
                                  >
                                    {student.roll_number || 'N/A'}
                                  </span>
                                </td>

                                <td style={{ padding: '14px' }}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '12px', fontWeight: 600 }}>
                                    <BookOpen size={12} />
                                    {student.program || `${dept?.code || 'Dept'} Course`}
                                  </div>
                                  {student.semester && (
                                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                      Semester {student.semester}
                                    </div>
                                  )}
                                </td>

                                <td style={{ padding: '14px', textAlign: 'center' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      fontWeight: 700,
                                      fontSize: '12px',
                                      color: student.stats?.registrations_count > 0 ? '#e8a025' : '#64748b',
                                      background: student.stats?.registrations_count > 0 ? 'rgba(232, 160, 37, 0.1)' : 'rgba(255,255,255,0.03)',
                                      padding: '3px 9px',
                                      borderRadius: '8px',
                                      border: student.stats?.registrations_count > 0 ? '1px solid rgba(232, 160, 37, 0.25)' : '1px solid rgba(255,255,255,0.06)',
                                    }}
                                  >
                                    {student.stats?.registrations_count || 0} events
                                  </span>
                                </td>

                                <td style={{ padding: '14px', textAlign: 'center' }}>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      fontWeight: 700,
                                      fontSize: '12px',
                                      color: student.stats?.attended_count > 0 ? '#2dd4bf' : '#64748b',
                                      background: student.stats?.attended_count > 0 ? 'rgba(45, 212, 191, 0.1)' : 'rgba(255,255,255,0.03)',
                                      padding: '3px 9px',
                                      borderRadius: '8px',
                                      border: student.stats?.attended_count > 0 ? '1px solid rgba(45, 212, 191, 0.25)' : '1px solid rgba(255,255,255,0.06)',
                                    }}
                                  >
                                    {student.stats?.attended_count || 0}
                                  </span>
                                </td>

                                <td style={{ padding: '14px', textAlign: 'center' }}>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontWeight: 700,
                                      fontSize: '12px',
                                      color: student.stats?.certificates_count > 0 ? '#fbbf24' : '#64748b',
                                      background: student.stats?.certificates_count > 0 ? 'rgba(251, 191, 36, 0.1)' : 'rgba(255,255,255,0.03)',
                                      padding: '3px 9px',
                                      borderRadius: '8px',
                                      border: student.stats?.certificates_count > 0 ? '1px solid rgba(251, 191, 36, 0.25)' : '1px solid rgba(255,255,255,0.06)',
                                    }}
                                  >
                                    <Award size={12} />
                                    {student.stats?.certificates_count || 0}
                                  </span>
                                </td>

                                <td style={{ padding: '14px', textAlign: 'right', color: '#94a3b8', fontSize: '12px' }}>
                                  {student.created_at ? new Date(student.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Propose Event Modal */}
      {showCreateModal && (
        <div
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
        >
          <div
            style={{
              background: '#0f1117',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h3
              style={{
                fontFamily: 'Outfit, system-ui, sans-serif',
                fontSize: '20px',
                fontWeight: 700,
                color: '#fff',
                margin: '0 0 4px 0',
              }}
            >
              Propose New Event for {dept?.code}
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 20px 0' }}>
              Submit your event proposal for faculty/admin review.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Hackathon 2026"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>Description *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detailed agenda, tracks, and objectives..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>Category *</label>
                  <select
                    value={createForm.category_id}
                    onChange={(e) => setCreateForm({ ...createForm, category_id: parseInt(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      outline: 'none',
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} style={{ background: '#0f1117' }}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>Event Mode</label>
                  <select
                    value={createForm.event_mode}
                    onChange={(e) => setCreateForm({ ...createForm, event_mode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      outline: 'none',
                    }}
                  >
                    <option value="Offline" style={{ background: '#0f1117' }}>Offline (Campus)</option>
                    <option value="Online" style={{ background: '#0f1117' }}>Online (Virtual)</option>
                    <option value="Hybrid" style={{ background: '#0f1117' }}>Hybrid</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>Event Date *</label>
                  <input
                    type="date"
                    required
                    value={createForm.event_date}
                    onChange={(e) => setCreateForm({ ...createForm, event_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>Venue *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tech Hub 301"
                    value={createForm.venue}
                    onChange={(e) => setCreateForm({ ...createForm, venue: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>Capacity</label>
                  <input
                    type="number"
                    min={1}
                    value={createForm.capacity}
                    onChange={(e) => setCreateForm({ ...createForm, capacity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '12px',
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>Type</label>
                  <select
                    value={createForm.participation_type}
                    onChange={(e) => setCreateForm({ ...createForm, participation_type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '12px',
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      outline: 'none',
                    }}
                  >
                    <option value="individual" style={{ background: '#0f1117' }}>Individual</option>
                    <option value="team" style={{ background: '#0f1117' }}>Team</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>Max Team</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={createForm.max_team_size}
                    onChange={(e) => setCreateForm({ ...createForm, max_team_size: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '12px',
                      background: '#0a0c0f',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    background: 'linear-gradient(135deg, #d4880f 0%, #e8a025 100%)',
                    color: '#0a0c0f',
                    fontWeight: 700,
                    padding: '10px 20px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {creating ? 'Submitting...' : 'Submit Proposal for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
