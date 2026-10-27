import { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Sparkles,
  Users,
  Layers,
} from 'lucide-react';
import { fetchCalendarEvents, fetchDepartments } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EventDetailModal from '../components/EventDetailModal';
import RegistrationModal from '../components/RegistrationModal';

export default function CalendarPage() {
  const { isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [personalOnly, setPersonalOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedEventForDetail, setSelectedEventForDetail] = useState(null);
  const [selectedEventForRegister, setSelectedEventForRegister] = useState(null);

  useEffect(() => {
    fetchDepartments().then((r) => {
      if (r.success) setDepartments(r.departments);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchCalendarEvents({
      department_id: selectedDept || undefined,
      personal_only: personalOnly,
    })
      .then((res) => {
        if (res.success) setCalendarEvents(res.events || []);
      })
      .catch(() => setCalendarEvents([]))
      .finally(() => setLoading(false));
  }, [selectedDept, personalOnly]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Calendar matrix calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(i);
  }

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Get events on a specific day
  const getEventsForDay = (day) => {
    if (!day) return [];
    return calendarEvents.filter((ev) => {
      const d = new Date(ev.start);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
      );
    });
  };

  return (
    <div style={{ background: '#0a0c0f', minHeight: 'calc(100vh - 64px)', color: '#e8eaf0' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 40px' }} className="space-y-8">
        
        {/* Header Bar */}
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
            <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2.5"
              style={{
                background: 'rgba(212,136,15,0.15)',
                color: '#e8a025',
                border: '1px solid rgba(212,136,15,0.3)',
              }}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Institutional Calendar
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
              {monthName} {year}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Scheduled workshops, hackathons, seminars, and sports meets across all departments.
            </p>
          </div>

          {/* Controls: Department filter, Personal filter, Month Navigation */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
              }}
              className="text-xs px-3.5 py-2.5 rounded-xl font-medium outline-hidden"
            >
              <option value="" style={{ background: '#0f1117' }}>All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} style={{ background: '#0f1117' }}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>

            {isAuthenticated && (
              <button
                onClick={() => setPersonalOnly(!personalOnly)}
                style={{
                  background: personalOnly ? 'linear-gradient(135deg, #d4880f, #e8a025)' : 'rgba(255,255,255,0.05)',
                  color: personalOnly ? '#0a0c0f' : '#cbd5e1',
                  border: personalOnly ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
                className="text-xs px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer hover:brightness-110"
              >
                My Registered Events Only
              </button>
            )}

            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              className="flex items-center gap-1 rounded-xl p-1"
            >
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-xs font-bold text-amber-400 hover:bg-white/10 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div
          style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.07)' }}
          className="rounded-3xl shadow-xl overflow-hidden"
        >
          {/* Day Headers */}
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
            className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 py-3.5 tracking-wider"
          >
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-white/5">
            {daysArray.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isToday =
                day &&
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <div
                  key={idx}
                  style={{
                    background: day ? (isToday ? 'rgba(212,136,15,0.04)' : 'transparent') : 'rgba(0,0,0,0.3)',
                  }}
                  className={`min-h-[120px] sm:min-h-[140px] p-2.5 flex flex-col justify-between transition-colors ${
                    day ? 'hover:bg-white/[0.02]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    {day ? (
                      <span
                        style={{
                          background: isToday ? 'linear-gradient(135deg, #d4880f, #e8a025)' : 'transparent',
                          color: isToday ? '#0a0c0f' : '#94a3b8',
                        }}
                        className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center font-mono"
                      >
                        {day}
                      </span>
                    ) : (
                      <span />
                    )}
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-amber-400/80">
                        {dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 overflow-y-auto max-h-[90px]">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEventForDetail(ev)}
                        className="w-full text-left p-1.5 px-2 rounded-lg text-[10px] font-medium leading-tight truncate block transition-all hover:brightness-110 active:scale-98 cursor-pointer"
                        style={{
                          backgroundColor: `${ev.category_color || '#d4880f'}20`,
                          color: ev.category_color || '#e8a025',
                          borderLeft: `3px solid ${ev.category_color || '#d4880f'}`,
                        }}
                        title={ev.title}
                      >
                        <span className="font-bold mr-1">[{ev.department_code}]</span>
                        {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] text-slate-500 font-bold block pl-1">
                        +{dayEvents.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <EventDetailModal
        event={selectedEventForDetail}
        isOpen={!!selectedEventForDetail}
        onClose={() => setSelectedEventForDetail(null)}
        onRegister={(ev) => {
          setSelectedEventForDetail(null);
          setSelectedEventForRegister(ev);
        }}
      />

      <RegistrationModal
        event={selectedEventForRegister}
        isOpen={!!selectedEventForRegister}
        onClose={() => setSelectedEventForRegister(null)}
        onSuccess={() => {
          fetchCalendarEvents({ personal_only: personalOnly }).then((r) => {
            if (r.success) setCalendarEvents(r.events);
          });
        }}
      />
    </div>
  );
}
