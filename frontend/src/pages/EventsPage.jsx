import { useState, useEffect, useRef } from 'react';
import {
  Search, Compass, Sparkles, Calendar,
  ArrowRight, Clock, Zap, Star, ChevronDown,
  BookOpen, Cpu, Palette, BarChart2, Music, Beaker, Globe, Trophy,
} from 'lucide-react';
import EventCard from '../components/EventCard';
import RegistrationModal from '../components/RegistrationModal';
import EventDetailModal from '../components/EventDetailModal';
import StudentAuthModal from '../components/StudentAuthModal';
import SupportContactSection from '../components/SupportContactSection';
import { useAuth } from '../context/AuthContext';
import { fetchEvents, fetchDepartments, fetchCategories } from '../services/api';

/* ── Animated stat counter ── */
function AnimatedStat({ value, suffix = '', label }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const target = parseInt(value) || 0;
    if (target === 0) return;
    const steps = 40;
    const increment = Math.ceil(target / steps);
    let cur = 0;
    const timer = setInterval(() => {
      cur = Math.min(cur + increment, target);
      setCount(cur);
      if (cur >= target) clearInterval(timer);
    }, 28);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <div>
      <p className="text-2xl sm:text-3xl font-black text-white leading-none" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
        {count}{suffix}
      </p>
      <p className="text-xs text-slate-400 mt-1 font-medium">{label}</p>
    </div>
  );
}

/* ── Live ticker ── */
function TickerBar({ events }) {
  if (!events.length) return null;
  const doubled = [...events, ...events];
  return (
    <div className="overflow-hidden py-2.5" style={{ background: 'rgba(212,136,15,0.04)', borderTop: '1px solid rgba(212,136,15,0.1)', borderBottom: '1px solid rgba(212,136,15,0.1)' }}>
      <div className="flex items-center gap-0 animate-marquee whitespace-nowrap">
        {doubled.map((e, i) => (
          <span key={i} className="inline-flex items-center gap-2.5 px-8 text-xs shrink-0">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#e8a025' }} />
            <span className="font-semibold" style={{ color: '#e8a025' }}>{e.title}</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">{e.department_name || e.department_code}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const CAT_ICONS = {
  'Technical': Cpu, 'Cultural': Music, 'Sports': Trophy,
  'Academic': BookOpen, 'Business': BarChart2, 'Arts': Palette,
  'Science': Beaker, 'Social': Globe,
};

export default function EventsPage() {
  const [events, setEvents]           = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);

  const [search, setSearch]                       = useState('');
  const [selectedDept, setSelectedDept]           = useState('ALL');
  const [selectedCat, setSelectedCat]             = useState('ALL');
  const [selectedMode, setSelectedMode]           = useState('');
  const [timeframe, setTimeframe]                 = useState('');
  const [participationType, setParticipationType] = useState('');

  const { isAuthenticated } = useAuth();
  const [detailEvent, setDetailEvent]     = useState(null);
  const [registerEvent, setRegisterEvent] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingEvent, setPendingEvent]   = useState(null);
  const eventsRef = useRef(null);

  const handleStartRegistration = (event) => {
    if (!isAuthenticated) {
      setPendingEvent(event);
      setAuthModalOpen(true);
    } else {
      setRegisterEvent(event);
    }
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    if (pendingEvent) {
      const target = pendingEvent;
      setPendingEvent(null);
      setRegisterEvent(target);
    }
  };

  useEffect(() => {
    Promise.all([fetchDepartments(), fetchCategories()]).then(([d, c]) => {
      if (d.success) setDepartments(d.departments || []);
      if (c.success) setCategories(c.categories || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchEvents({
      search: search || undefined,
      department: selectedDept !== 'ALL' ? selectedDept : undefined,
      category: selectedCat !== 'ALL' ? selectedCat : undefined,
      event_mode: selectedMode || undefined,
      timeframe: timeframe || undefined,
      participation_type: participationType || undefined,
      status: 'published',
      per_page: 40,
    })
      .then(r => { if (r.success) setEvents(r.events || []); })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [search, selectedDept, selectedCat, selectedMode, timeframe, participationType]);

  const featured   = events.filter(e => e.featured).slice(0, 3);
  const hasFilters = search || selectedDept !== 'ALL' || selectedCat !== 'ALL' || selectedMode || timeframe || participationType;

  const clearAll = () => {
    setSearch(''); setSelectedDept('ALL'); setSelectedCat('ALL');
    setSelectedMode(''); setTimeframe(''); setParticipationType('');
  };

  return (
    <div style={{ background: '#0a0c0f', minHeight: '100vh' }}>

      {/* ══════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════ */}
      <section style={{ position: 'relative', minHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Background image */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <img src="/hero.jpg" alt="Campus events" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.42 }} />
          {/* Left-to-right gradient so text is readable */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #0a0c0f 0%, rgba(10,12,15,0.90) 38%, rgba(10,12,15,0.55) 65%, rgba(10,12,15,0.22) 100%)' }} />
          {/* Bottom fade */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(to bottom, transparent, #0a0c0f)' }} />
        </div>

        {/* Ambient glow blobs */}
        <div style={{ position: 'absolute', top: '10%', left: '-4%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,136,15,0.09) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Content — constrained and padded */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '80px 40px 40px 40px' }}>

          {/* Top badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', background: 'rgba(212,136,15,0.12)', color: '#e8a025', border: '1px solid rgba(212,136,15,0.3)' }}>
              <Sparkles size={12} /> Institution-Wide Event Platform
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', background: 'rgba(20,184,166,0.1)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.25)' }}>
              <Zap size={12} /> Live · Spring 2026
            </span>
          </div>

          {/* Main headline */}
          <div style={{ maxWidth: '640px', marginBottom: '28px' }}>
            <h1 style={{ fontFamily: 'Outfit, system-ui, sans-serif', fontSize: 'clamp(2.4rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.02em', color: '#fff', margin: 0 }}>
              Where Campus<br />
              <span style={{ background: 'linear-gradient(135deg, #e8a025 0%, #f5d99c 45%, #2dd4bf 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Ideas Compete
              </span><br />
              &amp; Culture Lives.
            </h1>
            <p style={{ marginTop: '18px', fontSize: '15px', lineHeight: 1.7, color: '#94a3b8', maxWidth: '500px', fontWeight: 300 }}>
              From MCA hackathons and MBA case battles to M.Tech research colloquia,
              B.Tech robotics, and cultural festivals — one platform, every department.
            </p>
          </div>

          {/* CTA row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '48px' }}>
            <button
              onClick={() => eventsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', borderRadius: '10px', fontSize: '14px', fontWeight: 700, background: 'linear-gradient(135deg, #d4880f, #e8a025)', color: '#0a0c0f', border: 'none', cursor: 'pointer', boxShadow: '0 6px 22px rgba(212,136,15,0.35)', letterSpacing: '0.01em' }}
            >
              Explore Events <ArrowRight size={16} />
            </button>
            <a
              href="/calendar"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, background: 'rgba(212,136,15,0.08)', color: '#e8a025', border: '1px solid rgba(212,136,15,0.28)', cursor: 'pointer', textDecoration: 'none' }}
            >
              <Calendar size={15} /> View Calendar
            </a>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '40px', paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 'auto' }}>
            <AnimatedStat value={departments.length || 9} suffix="+" label="Academic Departments" />
            <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.08)' }} />
            <AnimatedStat value={events.length || 30} suffix="+" label="Published Events" />
            <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.08)' }} />
            <AnimatedStat value={100} suffix="%" label="Verified Certificates" />
            <div style={{ width: '1px', height: '36px', background: 'rgba(255,255,255,0.08)' }} />
            <AnimatedStat value={0} suffix="" label="Duplicate Registrations" />
          </div>
        </div>

        {/* Scroll nudge */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', paddingBottom: '24px' }}>
          <button
            onClick={() => eventsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '8px' }}
            className="animate-float"
          >
            <ChevronDown size={22} />
          </button>
        </div>
      </section>

      {/* ── Ticker bar ── */}
      <TickerBar events={events.slice(0, 14)} />

      {/* ══════════════════════════════════════════════════════════
          EVENTS DISCOVERY SECTION
      ══════════════════════════════════════════════════════════ */}
      <section ref={eventsRef} style={{ maxWidth: '1280px', margin: '0 auto', padding: '56px 40px 80px 40px' }}>

        {/* Section title row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#d4880f', marginBottom: '6px' }}>
              Browse &amp; Register
            </p>
            <h2 style={{ fontFamily: 'Outfit, system-ui, sans-serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
              {selectedDept !== 'ALL' ? `${selectedDept} Events` : 'All Campus Events'}
              <span style={{ fontSize: '14px', fontWeight: 400, color: '#475569', marginLeft: '10px' }}>
                ({events.length} found)
              </span>
            </h2>
          </div>
          {hasFilters && (
            <button
              onClick={clearAll}
              style={{ fontSize: '13px', fontWeight: 600, color: '#d4880f', background: 'rgba(212,136,15,0.08)', border: '1px solid rgba(212,136,15,0.25)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }}
            >
              Clear All Filters
            </button>
          )}
        </div>

        {/* ── Filter panel ── */}
        <div style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(15,17,23,0.95)', padding: '20px 24px', marginBottom: '36px' }}>

          {/* Row 1: search + dropdowns */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search events, venues, or keywords..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', background: 'rgba(10,12,15,0.9)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px 10px 40px', color: '#e8eaf0', fontSize: '14px', outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#d4880f'; e.target.style.boxShadow = '0 0 0 3px rgba(212,136,15,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Mode dropdown */}
            <select
              value={selectedMode}
              onChange={e => setSelectedMode(e.target.value)}
              style={{ background: 'rgba(10,12,15,0.9)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', outline: 'none', minWidth: '130px' }}
            >
              <option value="">All Modes</option>
              <option value="Offline">In-Person</option>
              <option value="Online">Virtual</option>
              <option value="Hybrid">Hybrid</option>
            </select>

            {/* Timeframe */}
            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value)}
              style={{ background: 'rgba(10,12,15,0.9)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', outline: 'none', minWidth: '130px' }}
            >
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Completed</option>
            </select>

            {/* Type */}
            <select
              value={participationType}
              onChange={e => setParticipationType(e.target.value)}
              style={{ background: 'rgba(10,12,15,0.9)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', outline: 'none', minWidth: '140px' }}
            >
              <option value="">All Types</option>
              <option value="individual">Individual</option>
              <option value="team">Team Event</option>
            </select>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '16px' }} />

          {/* Row 2: Department pills */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#334155', marginBottom: '10px' }}>Department</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[{ code: 'ALL', label: 'All Depts' }, ...departments.map(d => ({ code: d.code, label: d.code }))].map(d => (
                <button
                  key={d.code}
                  onClick={() => setSelectedDept(d.code)}
                  style={{
                    padding: '7px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, letterSpacing: '0.04em', transition: 'all 0.15s',
                    background: selectedDept === d.code ? 'rgba(212,136,15,0.18)' : 'rgba(22,25,35,0.8)',
                    color: selectedDept === d.code ? '#e8a025' : '#64748b',
                    border: selectedDept === d.code ? '1px solid rgba(212,136,15,0.45)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Category pills */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#334155', marginBottom: '10px' }}>Category</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedCat('ALL')}
                style={{
                  padding: '7px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  background: selectedCat === 'ALL' ? 'rgba(212,136,15,0.15)' : 'rgba(22,25,35,0.6)',
                  color: selectedCat === 'ALL' ? '#e8a025' : '#64748b',
                  border: selectedCat === 'ALL' ? '1px solid rgba(212,136,15,0.4)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                All Categories
              </button>
              {categories.map(c => {
                const Icon = CAT_ICONS[c.name] || Star;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCat(c.code)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '7px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      background: selectedCat === c.code ? 'rgba(212,136,15,0.15)' : 'rgba(22,25,35,0.6)',
                      color: selectedCat === c.code ? '#e8a025' : '#64748b',
                      border: selectedCat === c.code ? '1px solid rgba(212,136,15,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <Icon size={12} /> {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Featured Events ── */}
        {featured.length > 0 && !hasFilters && (
          <div style={{ marginBottom: '44px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '3px', height: '20px', borderRadius: '2px', background: '#e8a025' }} />
              <h3 style={{ fontFamily: 'Outfit, system-ui, sans-serif', fontSize: '16px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>
                Featured Events
              </h3>
              <Star size={15} color="#e8a025" fill="#e8a025" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {featured.map(e => (
                <EventCard key={e.id} event={e} onSelect={setDetailEvent} onRegister={handleStartRegistration} />
              ))}
            </div>
            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '36px 0 0 0', color: '#334155', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
              All Events
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
            </div>
          </div>
        )}

        {/* ── Event grid ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="skeleton" style={{ height: '380px', borderRadius: '16px' }} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div style={{ padding: '80px 24px', textAlign: 'center', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(15,17,23,0.6)' }}>
            <Compass size={44} color="#334155" style={{ margin: '0 auto 16px auto', display: 'block' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 8px 0' }}>No events match your filters</h3>
            <p style={{ fontSize: '13px', color: '#475569', maxWidth: '320px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
              Try a different department, category, or remove the search term.
            </p>
            <button
              onClick={clearAll}
              style={{ padding: '10px 24px', borderRadius: '10px', background: 'rgba(212,136,15,0.1)', color: '#e8a025', border: '1px solid rgba(212,136,15,0.3)', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {events.map(e => (
              <EventCard key={e.id} event={e} onSelect={setDetailEvent} onRegister={handleStartRegistration} />
            ))}
          </div>
        )}
      </section>

      {/* Campus Support & Contact Information */}
      <SupportContactSection />

      {/* Modals */}
      <EventDetailModal
        event={detailEvent}
        isOpen={!!detailEvent}
        onClose={() => setDetailEvent(null)}
        onRegister={ev => { setDetailEvent(null); handleStartRegistration(ev); }}
      />
      <RegistrationModal
        event={registerEvent}
        isOpen={!!registerEvent}
        onClose={() => setRegisterEvent(null)}
        onSuccess={() => fetchEvents({ status: 'published' }).then(r => { if (r.success) setEvents(r.events); })}
      />
      <StudentAuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingEvent(null);
        }}
        onSuccess={handleAuthSuccess}
        eventTitle={pendingEvent?.title || ''}
      />
    </div>
  );
}
