import { useState } from 'react';
import { MapPin, Users, Clock, Bookmark as BookmarkIcon, ArrowRight, Trophy, Wifi, WifiOff, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addBookmark, removeBookmark } from '../services/api';

const MODE_CONFIG = {
  online:  { label: 'Virtual',    bg: 'rgba(20,184,166,0.12)',  color: '#2dd4bf', border: 'rgba(45,212,191,0.25)' },
  hybrid:  { label: 'Hybrid',     bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa', border: 'rgba(139,92,246,0.25)' },
  offline: { label: 'In-Person',  bg: 'rgba(212,136,15,0.12)',  color: '#e8a025', border: 'rgba(212,136,15,0.3)' },
};

export default function EventCard({ event, onRegister, onSelect }) {
  const { isAuthenticated } = useAuth();
  const [bookmarked, setBookmarked] = useState(false);
  const [bmLoading, setBmLoading]   = useState(false);
  const [hovered, setHovered]       = useState(false);

  const handleBm = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated || bmLoading) return;
    setBmLoading(true);
    try {
      if (bookmarked) { await removeBookmark(event.id); setBookmarked(false); }
      else            { await addBookmark(event.id);    setBookmarked(true);  }
    } catch { /* ignore */ }
    finally { setBmLoading(false); }
  };

  const isFull    = event.is_full || event.available_seats <= 0;
  const isClosed  = !event.is_registration_open;
  const pctFilled = Math.min(100, Math.round(((event.capacity - event.available_seats) / event.capacity) * 100)) || 0;

  const dateObj   = new Date(event.event_date);
  const month     = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day       = dateObj.getDate();
  const modeKey   = (event.event_mode || 'offline').toLowerCase();
  const mode      = MODE_CONFIG[modeKey] || MODE_CONFIG.offline;

  const capColor  = pctFilled > 89 ? '#f87171' : pctFilled > 69 ? '#fbbf24' : '#2dd4bf';

  return (
    <div
      onClick={() => onSelect(event)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '14px',
        overflow: 'hidden',
        cursor: 'pointer',
        background: '#0f1117',
        border: hovered ? '1px solid rgba(232,160,37,0.35)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: hovered ? '0 16px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(232,160,37,0.12)' : '0 2px 12px rgba(0,0,0,0.3)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* ── Image / Poster ── */}
      <div style={{ position: 'relative', height: '180px', overflow: 'hidden', background: '#1d2333', flexShrink: 0 }}>
        <img
          src={event.poster_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80'}
          alt={event.title}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hovered ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.45s ease' }}
        />
        {/* Bottom scrim */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,12,15,0.88) 0%, rgba(10,12,15,0.1) 55%, transparent 100%)' }} />

        {/* Date badge — top-left */}
        <div style={{
          position: 'absolute', top: '12px', left: '12px',
          background: 'rgba(10,12,15,0.88)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(232,160,37,0.3)', borderRadius: '10px',
          padding: '6px 10px', textAlign: 'center', minWidth: '44px',
        }}>
          <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.06em', color: '#d4880f', margin: 0, lineHeight: 1 }}>{month}</p>
          <p style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.1, fontFamily: 'Outfit, system-ui, sans-serif' }}>{day}</p>
        </div>

        {/* Mode badge + bookmark — top-right */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px',
            background: mode.bg, color: mode.color, border: `1px solid ${mode.border}`,
          }}>
            {mode.label}
          </span>
          {isAuthenticated && (
            <button
              onClick={handleBm}
              disabled={bmLoading}
              style={{
                width: '28px', height: '28px', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: bookmarked ? '#e8a025' : 'rgba(10,12,15,0.7)',
                color: bookmarked ? '#0a0c0f' : '#fff',
                backdropFilter: 'blur(6px)',
              }}
            >
              <BookmarkIcon size={13} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        {/* Dept badge — bottom-left */}
        <div style={{ position: 'absolute', bottom: '10px', left: '12px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
            padding: '3px 9px', borderRadius: '6px',
            background: 'rgba(212,136,15,0.2)', color: '#e8a025', border: '1px solid rgba(212,136,15,0.35)',
          }}>
            {event.department_code || 'INSTITUTION'}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '18px 20px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Category */}
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#14b8a6', margin: '0 0 6px 0' }}>
          {event.category_name}
        </p>

        {/* Title */}
        <h3 style={{
          fontFamily: 'Outfit, system-ui, sans-serif', fontSize: '16px', fontWeight: 700, lineHeight: 1.35,
          color: hovered ? '#e8a025' : '#f1f5f9',
          margin: '0 0 8px 0', transition: 'color 0.2s',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {event.title}
        </h3>

        {/* Description */}
        <p style={{
          fontSize: '12.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 14px 0',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {event.description}
        </p>

        {/* Meta details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
            <Clock size={13} color="#d4880f" style={{ flexShrink: 0 }} />
            <span>{event.start_time || '10:00 AM'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
            <MapPin size={13} color="#14b8a6" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.venue}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
            <Users size={13} color="#a78bfa" style={{ flexShrink: 0 }} />
            <span>{event.participation_type === 'team' ? `Team (up to ${event.max_team_size})` : 'Individual'}</span>
          </div>
          {event.prizes && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
              <Trophy size={13} color="#fbbf24" style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#b45309' }}>{event.prizes}</span>
            </div>
          )}
        </div>

        {/* Spacer to push footer to bottom */}
        <div style={{ flex: 1 }} />

        {/* Capacity bar */}
        <div style={{ marginBottom: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
            <span style={{ color: '#475569', fontWeight: 500 }}>Capacity</span>
            <span style={{ color: isFull ? '#f87171' : '#2dd4bf', fontWeight: 700 }}>
              {isFull ? 'Full' : `${event.available_seats} left`}
            </span>
          </div>
          <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pctFilled}%`, borderRadius: '2px', background: capColor, transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={e => { e.stopPropagation(); onSelect(event); }}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              background: 'rgba(29,35,51,0.8)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.15s', fontFamily: 'DM Sans, sans-serif',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(37,45,66,0.9)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(29,35,51,0.8)'; }}
          >
            Details
          </button>
          <button
            onClick={e => { e.stopPropagation(); if (!isClosed) onRegister(event); }}
            disabled={isClosed}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, cursor: isClosed ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: isClosed ? 'rgba(30,30,40,0.6)' : 'linear-gradient(135deg, #d4880f, #e8a025)',
              color: isClosed ? '#475569' : '#0a0c0f',
              border: isClosed ? '1px solid rgba(255,255,255,0.05)' : 'none',
              boxShadow: isClosed ? 'none' : '0 4px 14px rgba(212,136,15,0.28)',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {isFull ? 'Full' : isClosed ? 'Closed' : (<>Register <ArrowRight size={14} /></>)}
          </button>
        </div>
      </div>
    </div>
  );
}
