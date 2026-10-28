import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Shield,
  Trophy,
  Award,
  Star,
  CheckCircle2,
  FileText,
  Share2,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchEventFeedback, submitEventFeedback, fetchEventResults, fetchEventWinnerCertificates } from '../services/api';
import HackathonCertificateModal, { formatPrizeRupee } from './HackathonCertificateModal';

export default function EventDetailModal({ event, isOpen, onClose, onRegister }) {
  const { user, isAuthenticated } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [results, setResults] = useState(null);
  const [winnerCerts, setWinnerCerts] = useState([]);
  const [selectedWinnerCert, setSelectedWinnerCert] = useState(null);
  const [rating, setRating] = useState(5);

  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, results, feedback

  useEffect(() => {
    if (event && isOpen) {
      setActiveTab('overview');
      // Fetch results
      fetchEventResults(event.id)
        .then((res) => {
          if (res.success) setResults(res.results);
        })
        .catch(() => setResults(null));

      // Fetch feedback
      fetchEventFeedback(event.id)
        .then((res) => {
          if (res.success) setFeedbacks(res.feedbacks || []);
        })
        .catch(() => setFeedbacks([]));

      // Fetch official winner certificates
      fetchEventWinnerCertificates(event.id)
        .then((res) => {
          if (res.success) setWinnerCerts(res.certificates || []);
        })
        .catch(() => setWinnerCerts([]));
    }
  }, [event, isOpen]);

  const handleOpenWinnerCert = (w, index) => {
    const matched = winnerCerts.find(
      (c) =>
        (c.recipient_name && c.recipient_name.toLowerCase() === (w.name || '').toLowerCase()) ||
        (c.rank_position && c.rank_position.toLowerCase() === (w.position || '').toLowerCase()) ||
        (w.cert_number && c.certificate_number === w.cert_number)
    );

    if (matched) {
      setSelectedWinnerCert(matched);
    } else {
      const pos = (w.position || '').toLowerCase();
      let certType = 'winner';
      if (pos.includes('2nd') || pos.includes('runner-up')) certType = 'runner_up';
      else if (pos.includes('3rd') || pos.includes('third')) certType = 'second_runner_up';
      else if (!pos.includes('1st') && !pos.includes('champion') && !pos.includes('winner')) certType = 'special_award';

      setSelectedWinnerCert({
        id: 9999 + index,
        certificate_number: w.cert_number || `HACK-${event.department?.code || 'GLOBAL'}-2026-WIN0${index + 1}-AUTH`,
        event_id: event.id,
        event_title: event.title,
        department_code: event.department?.code || 'MCA',
        department_name: event.department?.name || 'Department of Computer Science & Engineering',
        event_date: event.event_date,
        student_name: w.name,
        recipient_name: w.name,
        team_name: w.team,
        title: `Certificate of Extraordinary Achievement — ${event.title}`,
        cert_type: certType,
        rank_position: w.position,
        prize: w.prize,
        track: event.category?.name || 'Technical Innovation & AI Track',
        verification_hash: '6A1D84E4258BB73CD49CAEA9',
        issue_date: event.event_date || new Date().toISOString(),
        issuer_name: 'Hackathon Jury Directorate & Dean',
      });
    }
  };


  if (!isOpen || !event) return null;

  const toast = useToast();

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmittingFeedback(true);
    try {
      const res = await submitEventFeedback(event.id, { rating, comment });
      if (res.success) {
        setFeedbacks([res.feedback, ...feedbacks]);
        setComment('');
        toast.success('Feedback submitted successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const isFull = event.is_full || event.available_seats <= 0;
  const isClosed = !event.is_registration_open;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
        {/* Banner with close button */}
        <div className="relative h-56 w-full shrink-0 bg-slate-900">
          <img
            src={event.poster_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-md">
                {event.department_code || 'INSTITUTION'}
              </span>
              <span className="text-white/80 text-xs font-medium">
                {event.category_name}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Overview & Schedule
          </button>
          {results && (
            <button
              onClick={() => setActiveTab('results')}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'results'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Winners & Results
            </button>
          )}
          <button
            onClick={() => setActiveTab('feedback')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'feedback'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400" />
            Reviews ({feedbacks.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-600 dark:text-slate-300">
          {activeTab === 'overview' && (
            <>
              {/* Key metadata grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Date</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    {new Date(event.event_date).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Time</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{event.start_time || '10:00 AM'}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Mode</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{event.event_mode}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold">Availability</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    {event.available_seats} / {event.capacity} seats
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5">About This Event</h4>
                <p className="leading-relaxed whitespace-pre-line">{event.description}</p>
              </div>

              {/* Location & Eligibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">Venue & Location</span>
                  <p>{event.venue}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">Eligibility</span>
                  <p>{event.eligibility_criteria || 'Open to all enrolled students'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Allowed: {event.participating_departments?.join(', ') || 'ALL DEPARTMENTS'}
                  </p>
                </div>
              </div>

              {/* Prizes & Rules */}
              {event.prizes_rewards && (
                <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-300 text-sm mb-1">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Prizes & Recognition
                  </div>
                  <p className="text-amber-800 dark:text-amber-200">{event.prizes_rewards}</p>
                </div>
              )}

              {/* Coordinator Contact */}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Coordinator: {event.event_coordinator || 'Department Faculty'}</span>
                <span>Contact: {event.contact_info || 'info@college.edu'}</span>
              </div>
            </>
          )}

          {activeTab === 'results' && results && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm mb-1">Event Summary</h4>
                <p className="text-blue-800 dark:text-blue-200">{results.summary}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Official Winners & Rankings
                  </h4>
                  <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/25">
                    Verified Hackathon Credentials
                  </span>
                </div>

                <div className="space-y-2.5">
                  {results.winners?.map((w, i) => {
                    const posLower = (w.position || '').toLowerCase();
                    const isFirst = posLower.includes('1st') || posLower.includes('champion') || posLower.includes('winner');
                    const isSecond = posLower.includes('2nd') || posLower.includes('runner-up') || posLower.includes('runner up');
                    const isThird = posLower.includes('3rd') || posLower.includes('third');

                    const badgeBg = isFirst
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : isSecond
                      ? 'bg-slate-300/15 text-slate-300 border-slate-300/30'
                      : isThird
                      ? 'bg-amber-700/15 text-amber-600 border-amber-700/30'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

                    return (
                      <div
                        key={i}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border ${badgeBg}`}
                          >
                            {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : '🎖️'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeBg}`}>
                                {w.position}
                              </span>
                              {w.team && (
                                <span className="text-[11px] text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                                  {w.team}
                                </span>
                              )}
                            </div>
                            <div className="mt-1">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {w.name}
                              </span>
                              {w.department && (
                                <span className="text-slate-400 text-xs ml-1.5 font-medium">
                                  ({w.department})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 ml-auto">
                          {w.prize && (
                            <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              {formatPrizeRupee(w.prize)}
                            </span>
                          )}
                          <button
                            onClick={() => handleOpenWinnerCert(w, i)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.03]"
                          >
                            <Trophy className="w-3.5 h-3.5" />
                            <span>View Certificate 🏆</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}


          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {/* Submit Feedback Form */}
              {isAuthenticated && (
                <form onSubmit={handleFeedbackSubmit} className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">Leave Your Review</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className="p-1 text-amber-400 hover:scale-110 transition-transform"
                        >
                          <Star className={`w-4 h-4 ${s <= rating ? 'fill-amber-400' : 'text-slate-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Share your experience or takeaways from this event..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={submittingFeedback}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5 ml-auto cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Review
                  </button>
                </form>
              )}

              {/* Feedbacks List */}
              <div className="space-y-3">
                {feedbacks.length === 0 ? (
                  <p className="text-center py-6 text-slate-400">No participant reviews yet.</p>
                ) : (
                  feedbacks.map((f, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{f.user_name}</span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(f.rating)].map((_, idx) => (
                            <Star key={idx} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="mt-1 text-slate-600 dark:text-slate-300">{f.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Register CTA */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Seats Left</span>
            <span className={`text-sm font-bold ${isFull ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {isFull ? 'Sold Out' : `${event.available_seats} Available`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onRegister(event);
              }}
              disabled={isClosed}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                isClosed
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 hover:scale-[1.02]'
              }`}
            >
              {isFull ? 'Event Full' : isClosed ? 'Closed' : 'Register Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Official International Hackathon Certificate Modal */}
      {selectedWinnerCert && (
        <HackathonCertificateModal
          certificate={selectedWinnerCert}
          isOpen={!!selectedWinnerCert}
          onClose={() => setSelectedWinnerCert(null)}
        />
      )}
    </div>
  );
}

