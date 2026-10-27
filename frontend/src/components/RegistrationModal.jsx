import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Ticket,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { registerForEvent, fetchEventAvailability } from '../services/api';

export default function RegistrationModal({ event, isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    roll_number: '',
    department_code: 'MCA',
    program: '',
    phone: '',
    participation_type: 'individual',
    team_name: '',
    notes: '',
  });

  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [liveAvailability, setLiveAvailability] = useState(null);

  useEffect(() => {
    if (event && isOpen) {
      // Check live availability
      fetchEventAvailability(event.id)
        .then((res) => {
          if (res.success) setLiveAvailability(res);
        })
        .catch(() => {});

      // Prefill user data if logged in
      setFormData({
        full_name: user?.full_name || '',
        email: user?.email || '',
        roll_number: user?.roll_number || '',
        department_code: user?.department_code || event.department_code || 'MCA',
        program: user?.program || '',
        phone: user?.phone || '',
        participation_type: event.participation_type || 'individual',
        team_name: '',
        notes: '',
      });
      setTeamMembers([]);
      setErrorMsg('');
      setSuccessData(null);
    }
  }, [event, isOpen, user]);

  if (!isOpen || !event) return null;

  const handleAddTeammate = () => {
    if (teamMembers.length + 1 >= (event.max_team_size || 4)) return;
    setTeamMembers([...teamMembers, { name: '', email: '', roll_number: '', department_code: formData.department_code }]);
  };

  const handleRemoveTeammate = (index) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const handleTeammateChange = (index, field, value) => {
    const updated = [...teamMembers];
    updated[index][field] = value;
    setTeamMembers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const payload = {
        ...formData,
        team_members: teamMembers,
      };

      const res = await registerForEvent(event.id, payload);
      if (res.success) {
        setSuccessData(res.registration);
        if (onSuccess) onSuccess(res.registration);
      }
    } catch (err) {
      const errResp = err.response?.data;
      if (errResp?.error === 'DUPLICATE_REGISTRATION') {
        setErrorMsg('Duplicate Registration: This email / student roll number is already registered for this event!');
      } else if (errResp?.error === 'EVENT_FULL') {
        setErrorMsg('This event has just reached full capacity. No more seats available.');
      } else if (errResp?.error === 'INELIGIBLE_DEPARTMENT') {
        setErrorMsg(errResp.message || 'Department eligibility restriction: you are not eligible for this event.');
      } else {
        setErrorMsg(errResp?.message || 'An error occurred during registration. Please check your inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {successData ? (
          /* Success Receipt View */
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Registration Confirmed!</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
              You are officially registered for <span className="font-bold">{event.title}</span>.
            </p>

            <div className="mt-6 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Registration ID:</span>
                <span className="font-mono font-bold text-blue-600">#{successData.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Attendee Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{successData.user?.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-bold text-slate-900 dark:text-white">{successData.user?.department_code || 'General'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Event Date:</span>
                <span className="font-bold text-slate-900 dark:text-white">{new Date(event.event_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Venue:</span>
                <span className="font-bold text-slate-900 dark:text-white">{event.venue}</span>
              </div>
              {successData.team_name && (
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span className="text-slate-500">Team Name:</span>
                  <span className="font-bold text-indigo-600">{successData.team_name}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/dashboard');
                }}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                View in Student Dashboard
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Done & Return to Events
              </button>
            </div>
          </div>
        ) : (
          /* Registration Form View */
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Register for Event</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{event.title}</p>
              </div>
            </div>

            {/* Authenticated user badge */}
            {user && (
              <div className="mt-3 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-amber-400 font-medium">
                  Signed in as: <strong className="text-white font-bold">{user.full_name || user.email}</strong>
                </span>
                <span className="text-[11px] text-amber-300 font-semibold bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  ✓ Recorded to Student Dashboard
                </span>
              </div>
            )}

            {/* Event Quick Info Banner */}
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>{new Date(event.event_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span className="truncate max-w-[150px]">{event.venue}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto font-bold text-emerald-600 dark:text-emerald-400">
                <span>{liveAvailability ? `${liveAvailability.available_seats} seats left` : `${event.available_seats} seats left`}</span>
              </div>
            </div>

            {/* Error Message Alert */}
            {errorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 flex items-start gap-2.5 text-red-700 dark:text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
              {/* Participation Type Toggle */}
              {event.participation_type === 'team' && (
                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <label className="block font-bold text-indigo-900 dark:text-indigo-300 mb-1">
                    Team Event Registration (Max {event.max_team_size} members)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your Team Name"
                    value={formData.team_name}
                    onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">College Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. alex.mca@college.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Roll / Student ID</label>
                  <input
                    type="text"
                    placeholder="e.g. MCA-2026-001"
                    value={formData.roll_number}
                    onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <select
                    value={formData.department_code}
                    onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="MCA">MCA — Computer Applications</option>
                    <option value="MBA">MBA — Business Administration</option>
                    <option value="MTECH">M.Tech — Technology</option>
                    <option value="BTECH">B.Tech — Engineering</option>
                    <option value="BCA">BCA — Computer Applications</option>
                    <option value="BBA">BBA — Business Administration</option>
                    <option value="BCOM">B.Com — Commerce</option>
                    <option value="BSC">B.Sc — Science</option>
                    <option value="MSC">M.Sc — Science</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Teammates List (if team event) */}
              {event.participation_type === 'team' && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Team Members ({teamMembers.length + 1} of {event.max_team_size})
                    </span>
                    {teamMembers.length + 1 < (event.max_team_size || 4) && (
                      <button
                        type="button"
                        onClick={handleAddTeammate}
                        className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Teammate
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {teamMembers.map((tm, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-600">
                        <input
                          type="text"
                          required
                          placeholder="Teammate Name"
                          value={tm.name}
                          onChange={(e) => handleTeammateChange(idx, 'name', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                        />
                        <input
                          type="email"
                          required
                          placeholder="Teammate Email"
                          value={tm.email}
                          onChange={(e) => handleTeammateChange(idx, 'email', e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTeammate(idx)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Securing Your Registration...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
                <p className="text-[11px] text-center text-slate-400 mt-2">
                  System verifies duplicate prevention and seat availability instantaneously.
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
