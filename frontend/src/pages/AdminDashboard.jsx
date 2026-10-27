import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Layers,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Plus,
  AlertTriangle,
  Loader2,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Check,
  X,
  UserPlus,
  ToggleLeft,
  ToggleRight,
  Search,
  GraduationCap,
  Briefcase,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
} from 'recharts';
import {
  fetchInstitutionDashboard,
  fetchDepartments,
  approveEvent,
  rejectEvent,
  createDepartment,
  createCategory,
  exportMasterReport,
  fetchUsers,
  createUser,
  toggleUserActive,
  deleteUser,
} from '../services/api';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, approvals, departments, users, audit

  // Modals
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [newDeptForm, setNewDeptForm] = useState({
    name: '',
    code: '',
    description: '',
    coordinator_name: '',
    coordinator_email: '',
    programs: ['Regular Degree'],
  });

  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatForm, setNewCatForm] = useState({
    name: '',
    code: '',
    description: '',
    color: '#d4880f',
  });

  const [approvalActionLoading, setApprovalActionLoading] = useState(false);

  // User Management state
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUserCreated, setNewUserCreated] = useState(null); // holds { user, default_password } after creation
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'dept_coordinator',
    department_code: '',
    program: '',
    password: '',
  });

  useEffect(() => {
    loadDashboard();
    // Pre-fetch departments for user creation form
    fetchDepartments().then((r) => { if (r.success) setDepartments(r.departments || []); }).catch(() => {});
  }, []);

  const loadDashboard = () => {
    setLoading(true);
    fetchInstitutionDashboard()
      .then((res) => {
        if (res.success) setDashboardData(res);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadUsers = useCallback(() => {
    setUsersLoading(true);
    const params = {};
    if (userRoleFilter) params.role = userRoleFilter;
    if (userSearch) params.search = userSearch;
    fetchUsers(params)
      .then((r) => { if (r.success) setAllUsers(r.users || []); })
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  }, [userRoleFilter, userSearch]);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
  }, [activeTab, loadUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserActionLoading(true);
    try {
      const payload = { ...newUserForm };
      if (!payload.password) delete payload.password; // let backend auto-generate
      const res = await createUser(payload);
      if (res.success) {
        setNewUserCreated({ user: res.user, default_password: res.default_password });
        setNewUserForm({ full_name: '', email: '', phone: '', role: 'dept_coordinator', department_code: '', program: '', password: '' });
        loadUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      const res = await toggleUserActive(userId);
      if (res.success) loadUsers();
    } catch (err) {
      alert('Failed to toggle user status.');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Deactivate user "${name}"? They will not be able to login.`)) return;
    try {
      const res = await deleteUser(userId);
      if (res.success) loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to deactivate user.');
    }
  };

  const handleApprove = async (eventId) => {
    setApprovalActionLoading(true);
    try {
      const res = await approveEvent(eventId, 'Approved by Super Admin.');
      if (res.success) {
        alert(res.message);
        loadDashboard();
      }
    } catch (err) {
      alert('Could not approve event.');
    } finally {
      setApprovalActionLoading(false);
    }
  };

  const handleReject = async (eventId) => {
    const reason = prompt('Please enter feedback remarks for rejection:');
    if (!reason) return;
    setApprovalActionLoading(true);
    try {
      const res = await rejectEvent(eventId, reason);
      if (res.success) {
        alert('Event proposal rejected with feedback sent to coordinator.');
        loadDashboard();
      }
    } catch (err) {
      alert('Could not reject event.');
    } finally {
      setApprovalActionLoading(false);
    }
  };

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      const res = await createDepartment(newDeptForm);
      if (res.success) {
        alert(`Department ${res.department?.name} created!`);
        setShowDeptModal(false);
        setNewDeptForm({
          name: '',
          code: '',
          description: '',
          coordinator_name: '',
          coordinator_email: '',
          programs: ['Regular Degree'],
        });
        loadDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const res = await createCategory(newCatForm);
      if (res.success) {
        alert(`Category ${res.category?.name} created!`);
        setShowCatModal(false);
        setNewCatForm({ name: '', code: '', description: '', color: '#d4880f' });
        loadDashboard();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create category');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{ background: '#0a0c0f' }}>
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const kpis = dashboardData?.kpis;
  const deptStats = dashboardData?.department_stats || [];
  const catStats = dashboardData?.category_stats || [];
  const monthlyTrends = dashboardData?.monthly_trends || [];
  const pendingApprovals = dashboardData?.pending_approvals || [];
  const recentAudits = dashboardData?.recent_audits || [];

  const PIE_COLORS = ['#d4880f', '#14b8a6', '#f59e0b', '#2dd4bf', '#ef4444', '#a855f7', '#3b82f6', '#10b981'];

  return (
    <div style={{ background: '#0a0c0f', minHeight: 'calc(100vh - 64px)', color: '#e8eaf0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 40px' }} className="space-y-8">
        
        {/* Super Admin Hub Banner */}
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
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2.5"
              style={{
                background: 'rgba(239,68,68,0.12)',
                color: '#f87171',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
            >
              <Shield className="w-3.5 h-3.5 text-red-400" />
              Central Institutional Administration
            </div>
            <h1
              style={{
                fontFamily: 'Outfit, system-ui, sans-serif',
                fontSize: '28px',
                fontWeight: 700,
                color: '#ffffff',
                margin: 0,
              }}
            >
              Executive Management Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Multi-department oversight, event proposal sanctioning, attendance audit logs, and institutional analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowDeptModal(true)}
              style={{
                background: 'linear-gradient(135deg, #d4880f 0%, #e8a025 100%)',
                color: '#0a0c0f',
                fontWeight: 700,
                boxShadow: '0 4px 18px rgba(212,136,15,0.35)',
              }}
              className="px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all hover:brightness-110 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Add Department
            </button>
            <button
              onClick={() => exportMasterReport('events')}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#e2e8f0',
              }}
              className="px-4 py-2.5 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
              Master CSV
            </button>
          </div>
        </div>

        {/* 6 Key Executive KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div
            style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)' }}
            className="p-4 rounded-2xl"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400">Departments</span>
            <span
              className="block text-2xl font-extrabold text-white mt-1"
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              {kpis?.total_departments || 9}
            </span>
            <span className="text-[10px] text-teal-400 font-medium">Active & verified</span>
          </div>

          <div
            style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)' }}
            className="p-4 rounded-2xl"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Events</span>
            <span
              className="block text-2xl font-extrabold text-amber-400 mt-1"
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              {kpis?.total_events || 30}
            </span>
            <span className="text-[10px] text-slate-500">{kpis?.published_events || 0} published</span>
          </div>

          <div
            style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)' }}
            className="p-4 rounded-2xl"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400">Pending Review</span>
            <span
              className="block text-2xl font-extrabold text-amber-300 mt-1"
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              {kpis?.pending_approvals || 0}
            </span>
            <span className="text-[10px] text-amber-400 font-medium">Needs action</span>
          </div>

          <div
            style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)' }}
            className="p-4 rounded-2xl"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400">Registrations</span>
            <span
              className="block text-2xl font-extrabold text-teal-300 mt-1"
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              {kpis?.confirmed_registrations || 0}
            </span>
            <span className="text-[10px] text-slate-500">Confirmed seats</span>
          </div>

          <div
            style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)' }}
            className="p-4 rounded-2xl"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400">Utilization</span>
            <span
              className="block text-2xl font-extrabold text-emerald-400 mt-1"
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              {kpis?.utilization_rate || 0}%
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">Capacity load</span>
          </div>

          <div
            style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)' }}
            className="p-4 rounded-2xl"
          >
            <span className="text-[10px] uppercase font-bold text-slate-400">Certificates</span>
            <span
              className="block text-2xl font-extrabold text-purple-300 mt-1"
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              {kpis?.total_certificates || 0}
            </span>
            <span className="text-[10px] text-slate-500">Issued & verified</span>
          </div>
        </div>

        {/* Tab Headers */}
        <div
          style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.06)' }}
          className="flex rounded-2xl p-1.5 text-xs font-bold gap-1.5 overflow-x-auto"
        >
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              background: activeTab === 'overview' ? 'linear-gradient(135deg, #d4880f, #e8a025)' : 'transparent',
              color: activeTab === 'overview' ? '#0a0c0f' : '#94a3b8',
            }}
            className="px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 font-bold"
          >
            <BarChart3 className="w-4 h-4" />
            Institution Analytics & Charts
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            style={{
              background: activeTab === 'approvals' ? 'linear-gradient(135deg, #d4880f, #e8a025)' : 'transparent',
              color: activeTab === 'approvals' ? '#0a0c0f' : '#94a3b8',
            }}
            className="px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 font-bold"
          >
            <Clock className="w-4 h-4" />
            Approval Queue ({pendingApprovals.length})
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            style={{
              background: activeTab === 'departments' ? 'linear-gradient(135deg, #d4880f, #e8a025)' : 'transparent',
              color: activeTab === 'departments' ? '#0a0c0f' : '#94a3b8',
            }}
            className="px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 font-bold"
          >
            <Layers className="w-4 h-4" />
            Department Directory ({deptStats.length})
          </button>

          <button
            onClick={() => { setActiveTab('users'); }}
            style={{
              background: activeTab === 'users' ? 'linear-gradient(135deg, #d4880f, #e8a025)' : 'transparent',
              color: activeTab === 'users' ? '#0a0c0f' : '#94a3b8',
            }}
            className="px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 font-bold"
          >
            <Users className="w-4 h-4" />
            User Management
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            style={{
              background: activeTab === 'audit' ? 'linear-gradient(135deg, #d4880f, #e8a025)' : 'transparent',
              color: activeTab === 'audit' ? '#0a0c0f' : '#94a3b8',
            }}
            className="px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 font-bold"
          >
            <Shield className="w-4 h-4" />
            Compliance Audit Log
          </button>
        </div>

        {/* Tab 1: Overview with Recharts Charts */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Bar Chart */}
              <div
                style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)' }}
                className="p-6 rounded-3xl shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    Events Organized by Department
                  </h3>
                  <span className="text-[11px] text-slate-500">Total events</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptStats}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                      <XAxis dataKey="code" fontSize={11} stroke="#64748b" />
                      <YAxis fontSize={11} stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0a0c0f',
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="events_count" name="Events Count" fill="#d4880f" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Pie Chart */}
              <div
                style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)' }}
                className="p-6 rounded-3xl shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-teal-400" />
                    Event Category Distribution
                  </h3>
                  <button
                    onClick={() => setShowCatModal(true)}
                    className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    + Add Category
                  </button>
                </div>
                <div className="h-64 flex items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={catStats}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={4}
                      >
                        {catStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0a0c0f',
                          borderColor: 'rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Monthly Trend Area Chart */}
            <div
              style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)' }}
              className="p-6 rounded-3xl shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-400" />
                  Monthly Registration Growth & Momentum
                </h3>
                <span className="text-xs text-teal-400 font-bold">Live database trends</span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends}>
                    <defs>
                      <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.06} />
                    <XAxis dataKey="month" fontSize={11} stroke="#64748b" />
                    <YAxis fontSize={11} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0a0c0f',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="registrations"
                      name="Registrations"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorReg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Approval Queue */}
        {activeTab === 'approvals' && (
          <div
            style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)' }}
            className="rounded-3xl overflow-hidden shadow-xl"
          >
            <div
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
              className="p-5 flex items-center justify-between"
            >
              <h3 className="font-bold text-sm text-white">
                Proposals Awaiting Administrative / Faculty Sanction
              </h3>
              <span className="text-xs text-amber-400 font-bold">{pendingApprovals.length} pending</span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-10 h-10 text-teal-400 mx-auto mb-2" />
                All event proposals have been reviewed and sanctioned!
              </div>
            ) : (
              <div className="divide-y divide-white/5 text-xs">
                {pendingApprovals.map((ev) => (
                  <div key={ev.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          style={{
                            background: 'rgba(212,136,15,0.15)',
                            color: '#e8a025',
                            border: '1px solid rgba(212,136,15,0.3)',
                          }}
                          className="font-bold px-2 py-0.5 rounded text-[10px]"
                        >
                          {ev.department_code}
                        </span>
                        <span className="text-teal-400 font-medium">{ev.category_name}</span>
                        <span className="text-slate-500">• Date: {new Date(ev.event_date).toLocaleDateString()}</span>
                      </div>
                      <h4 className="font-bold text-white text-sm">{ev.title}</h4>
                      <p className="text-slate-400 line-clamp-1 mt-0.5">{ev.description}</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Coordinator: {ev.event_coordinator} • Mode: {ev.event_mode} • Capacity: {ev.capacity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleReject(ev.id)}
                        disabled={approvalActionLoading}
                        style={{
                          background: 'rgba(239,68,68,0.12)',
                          color: '#f87171',
                          border: '1px solid rgba(239,68,68,0.25)',
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer hover:brightness-110"
                      >
                        Reject / Feedback
                      </button>
                      <button
                        onClick={() => handleApprove(ev.id)}
                        disabled={approvalActionLoading}
                        style={{
                          background: 'linear-gradient(135deg, #d4880f, #e8a025)',
                          color: '#0a0c0f',
                          fontWeight: 700,
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:brightness-110"
                      >
                        Approve & Publish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Department Directory */}
        {activeTab === 'departments' && (
          <div
            style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)' }}
            className="rounded-3xl overflow-hidden shadow-xl"
          >
            <div
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
              className="p-5 flex items-center justify-between"
            >
              <h3 className="font-bold text-sm text-white">Academic Departments</h3>
              <button
                onClick={() => setShowDeptModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #d4880f, #e8a025)',
                  color: '#0a0c0f',
                  fontWeight: 700,
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer hover:brightness-110"
              >
                + New Department
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  className="text-slate-400 font-bold uppercase tracking-wider text-[11px]"
                >
                  <tr>
                    <th className="p-4">Code</th>
                    <th className="p-4">Department Name</th>
                    <th className="p-4">Events Count</th>
                    <th className="p-4">Confirmed Registrations</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {deptStats.map((d) => (
                    <tr key={d.code} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-mono font-bold text-amber-400">{d.code}</td>
                      <td className="p-4 font-bold text-white">{d.name}</td>
                      <td className="p-4 font-semibold text-slate-300">{d.events_count} events</td>
                      <td className="p-4 font-semibold text-teal-400">{d.registrations_count}</td>
                      <td className="p-4">
                        <span
                          style={{
                            background: 'rgba(20,184,166,0.15)',
                            color: '#2dd4bf',
                            border: '1px solid rgba(20,184,166,0.25)',
                          }}
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                        >
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: User Management */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Header bar */}
            <div
              style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)' }}
              className="p-5 rounded-3xl flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  Faculty, Coordinators & Students
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  All user accounts — stored live in SQLite database.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Role filter */}
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
                  className="px-3 py-2 rounded-xl text-xs font-medium outline-none"
                >
                  <option value="">All Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="dept_coordinator">Dept. Coordinator</option>
                  <option value="faculty_coordinator">Faculty Coordinator</option>
                  <option value="student">Student</option>
                  <option value="organizer">Organizer</option>
                </select>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name or email…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
                    className="pl-8 pr-3 py-2 rounded-xl text-xs outline-none w-48"
                  />
                </div>
                <button
                  onClick={loadUsers}
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
                  className="px-3 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-white/10"
                >
                  Search
                </button>
                <button
                  onClick={() => { setShowUserModal(true); setNewUserCreated(null); }}
                  style={{ background: 'linear-gradient(135deg, #d4880f, #e8a025)', color: '#0a0c0f', fontWeight: 700 }}
                  className="px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer hover:brightness-110"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Add Faculty / Coordinator
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div
              style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)' }}
              className="rounded-3xl overflow-hidden shadow-xl"
            >
              {usersLoading ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                </div>
              ) : allUsers.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No users found. Create one above.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead
                      style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                      className="text-slate-400 font-bold uppercase tracking-wider text-[11px]"
                    >
                      <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Department</th>
                        <th className="p-4">Program / Course</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {allUsers.map((u) => {
                        const roleColors = {
                          super_admin: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
                          dept_coordinator: { bg: 'rgba(212,136,15,0.12)', color: '#e8a025', border: 'rgba(212,136,15,0.25)' },
                          faculty_coordinator: { bg: 'rgba(20,184,166,0.12)', color: '#2dd4bf', border: 'rgba(20,184,166,0.25)' },
                          student: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
                          organizer: { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', border: 'rgba(168,85,247,0.25)' },
                        };
                        const rc = roleColors[u.role] || roleColors.organizer;
                        return (
                          <tr key={u.id} className="hover:bg-white/[0.015] transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black flex-shrink-0"
                                  style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}
                                >
                                  {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <span className="font-bold text-white">{u.full_name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-400 font-mono">{u.email}</td>
                            <td className="p-4">
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}
                              >
                                {u.role.replace(/_/g, ' ').toUpperCase()}
                              </span>
                            </td>
                            <td className="p-4 font-mono font-bold text-amber-400">{u.department_code || '—'}</td>
                            <td className="p-4 text-slate-400">{u.program || '—'}</td>
                            <td className="p-4">
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                                style={{
                                  background: u.is_active ? 'rgba(20,184,166,0.15)' : 'rgba(239,68,68,0.12)',
                                  color: u.is_active ? '#2dd4bf' : '#f87171',
                                  border: `1px solid ${u.is_active ? 'rgba(20,184,166,0.3)' : 'rgba(239,68,68,0.25)'}`,
                                }}
                              >
                                {u.is_active ? 'ACTIVE' : 'DISABLED'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleUser(u.id)}
                                  title={u.is_active ? 'Disable account' : 'Enable account'}
                                  className="p-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                                  style={{ color: u.is_active ? '#2dd4bf' : '#94a3b8' }}
                                >
                                  {u.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                </button>
                                {u.role !== 'super_admin' && (
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.full_name)}
                                    title="Deactivate user"
                                    className="p-1.5 rounded-lg cursor-pointer hover:bg-red-500/10 transition-colors text-slate-500 hover:text-red-400"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-5 py-3 text-[11px] text-slate-500 border-t border-white/5">
                    {allUsers.length} user{allUsers.length !== 1 ? 's' : ''} — all stored in SQLite database
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Compliance Audit Log */}
        {activeTab === 'audit' && (
          <div
            style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)' }}
            className="rounded-3xl overflow-hidden shadow-xl"
          >
            <div
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
              className="p-5 font-bold text-xs text-white"
            >
              Institutional Action & Compliance History
            </div>
            <div className="divide-y divide-white/5 text-xs">
              {recentAudits.map((a) => (
                <div key={a.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-amber-400 mr-2">
                      [{a.action}]
                    </span>
                    <span className="text-white font-medium">{a.details}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">By: {a.user_email || 'System'}</p>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Department Modal */}
      {showDeptModal && (
        <div
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
        >
          <div
            style={{
              background: '#0f1117',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
            }}
            className="rounded-3xl max-w-md w-full p-6 shadow-2xl"
          >
            <h3
              className="text-lg font-bold text-white mb-3"
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              Add Academic Department
            </h3>
            <form onSubmit={handleCreateDepartment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master of Computer Applications"
                  value={newDeptForm.name}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, name: e.target.value })}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                  }}
                  className="w-full px-3 py-2 rounded-xl outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MCA"
                  value={newDeptForm.code}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, code: e.target.value.toUpperCase() })}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                  }}
                  className="w-full px-3 py-2 rounded-xl font-mono outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Coordinator Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ramesh Sharma"
                  value={newDeptForm.coordinator_name}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, coordinator_name: e.target.value })}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                  }}
                  className="w-full px-3 py-2 rounded-xl outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Coordinator Email</label>
                <input
                  type="email"
                  placeholder="coordinator@college.edu"
                  value={newDeptForm.coordinator_email}
                  onChange={(e) => setNewDeptForm({ ...newDeptForm, coordinator_email: e.target.value })}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                  }}
                  className="w-full px-3 py-2 rounded-xl outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8',
                  }}
                  className="px-4 py-2 rounded-xl font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #d4880f 0%, #e8a025 100%)',
                    color: '#0a0c0f',
                    fontWeight: 700,
                  }}
                  className="px-4 py-2 rounded-xl cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCatModal && (
        <div
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
        >
          <div
            style={{
              background: '#0f1117',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
            }}
            className="rounded-3xl max-w-md w-full p-6 shadow-2xl"
          >
            <h3
              className="text-lg font-bold text-white mb-3"
              style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
            >
              Add Event Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Entrepreneurship & Startups"
                  value={newCatForm.name}
                  onChange={(e) => setNewCatForm({ ...newCatForm, name: e.target.value })}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                  }}
                  className="w-full px-3 py-2 rounded-xl outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Category Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STARTUP"
                  value={newCatForm.code}
                  onChange={(e) => setNewCatForm({ ...newCatForm, code: e.target.value.toUpperCase() })}
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                  }}
                  className="w-full px-3 py-2 rounded-xl font-mono outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8',
                  }}
                  className="px-4 py-2 rounded-xl font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #d4880f 0%, #e8a025 100%)',
                    color: '#0a0c0f',
                    fontWeight: 700,
                  }}
                  className="px-4 py-2 rounded-xl cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showUserModal && (
        <div
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowUserModal(false); setNewUserCreated(null); } }}
        >
          <div
            style={{
              background: '#0f1117',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 30px 70px rgba(0,0,0,0.9)',
            }}
            className="rounded-3xl max-w-lg w-full p-7 shadow-2xl"
          >
            {newUserCreated ? (
              /* Success screen after creation */
              <div className="text-center space-y-5">
                <div
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
                  style={{ background: 'rgba(20,184,166,0.15)', border: '1px solid rgba(20,184,166,0.3)' }}
                >
                  <CheckCircle2 className="w-8 h-8 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                    User Created & Saved to Database ✓
                  </h3>
                  <p className="text-xs text-slate-400">
                    Account for <span className="text-white font-semibold">{newUserCreated.user.full_name}</span> has been
                    persisted to SQLite.
                  </p>
                </div>
                <div
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                  className="rounded-2xl p-4 text-left space-y-2 text-xs"
                >
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email</span>
                    <span className="font-mono text-white">{newUserCreated.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Role</span>
                    <span className="font-bold text-amber-400">{newUserCreated.user.role.replace(/_/g, ' ').toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Department</span>
                    <span className="font-mono text-teal-400">{newUserCreated.user.department_code || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Login Password</span>
                    <span
                      className="font-mono font-bold px-2.5 py-1 rounded-lg text-[11px]"
                      style={{ background: 'rgba(212,136,15,0.15)', color: '#e8a025', border: '1px solid rgba(212,136,15,0.3)' }}
                    >
                      {newUserCreated.default_password}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Share these credentials with the faculty member. They can change their password after first login.
                </p>
                <div className="flex gap-3 justify-center pt-2">
                  <button
                    onClick={() => setNewUserCreated(null)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer hover:bg-white/10"
                  >
                    Create Another
                  </button>
                  <button
                    onClick={() => { setShowUserModal(false); setNewUserCreated(null); }}
                    style={{ background: 'linear-gradient(135deg, #d4880f, #e8a025)', color: '#0a0c0f', fontWeight: 700 }}
                    className="px-5 py-2.5 rounded-xl text-xs cursor-pointer hover:brightness-110"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Create User Form */
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                    Add Faculty / Coordinator
                  </h3>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mb-5">
                  New accounts are immediately saved to the SQLite database. A login password will be auto-generated if not specified.
                </p>
                <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Dr. Priya Sharma"
                        value={newUserForm.full_name}
                        onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                        className="w-full px-3 py-2 rounded-xl outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Phone</label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={newUserForm.phone}
                        onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                        className="w-full px-3 py-2 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="faculty@college.edu"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                      className="w-full px-3 py-2 rounded-xl outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Role *</label>
                      <select
                        value={newUserForm.role}
                        onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
                        className="w-full px-3 py-2 rounded-xl outline-none font-medium"
                      >
                        <option value="dept_coordinator">Dept. Coordinator</option>
                        <option value="faculty_coordinator">Faculty Coordinator</option>
                        <option value="organizer">Organizer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Department</label>
                      <select
                        value={newUserForm.department_code}
                        onChange={(e) => setNewUserForm({ ...newUserForm, department_code: e.target.value })}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
                        className="w-full px-3 py-2 rounded-xl outline-none font-mono"
                      >
                        <option value="">No Department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.code}>{d.code} — {d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Program / Specialization</label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science Faculty, MBA Finance"
                      value={newUserForm.program}
                      onChange={(e) => setNewUserForm({ ...newUserForm, program: e.target.value })}
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                      className="w-full px-3 py-2 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-300 mb-1">
                      Login Password
                      <span className="ml-1 font-normal text-slate-500">(leave blank to auto-generate: Faculty@123)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Optional — min 8 characters"
                        value={newUserForm.password}
                        onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                        className="w-full px-3 py-2 pr-9 rounded-xl outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{ background: 'rgba(212,136,15,0.08)', border: '1px solid rgba(212,136,15,0.2)' }}
                    className="rounded-xl p-3 text-[11px] text-amber-300"
                  >
                    ✓ This user will be immediately written to SQLite and can log in using the Staff Sign In portal.
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowUserModal(false)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}
                      className="px-4 py-2 rounded-xl font-semibold cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={userActionLoading}
                      style={{ background: 'linear-gradient(135deg, #d4880f 0%, #e8a025 100%)', color: '#0a0c0f', fontWeight: 700 }}
                      className="px-5 py-2 rounded-xl cursor-pointer hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60"
                    >
                      {userActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Create & Save to Database
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
