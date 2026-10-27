import { useState } from 'react';
import {
  Phone, Mail, MapPin, Clock, MessageSquare,
  LifeBuoy, Send, CheckCircle2, HelpCircle,
  ChevronDown, ChevronUp, Shield, Sparkles
} from 'lucide-react';

export default function SupportContactSection() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    course: 'MCA',
    subject: '',
    message: '',
  });

  const faqs = [
    {
      q: 'Can students from different departments register for any event?',
      a: 'Yes! The portal features open institutional participation. Whether you are enrolled in B.Tech, M.Tech, MCA, MBA, BCA, or BBA, your registration is automatically stored and organized under the respective host department coordinator.',
    },
    {
      q: 'How do I download and verify my event certificate?',
      a: 'Once an event is completed and attendance is confirmed, your certificate is automatically generated with a cryptographic SHA-256 hash, QR code, and official faculty signatures. You can download it directly from your Student Dashboard or verify it at the public /verify-certificate endpoint.',
    },
    {
      q: 'What should I do if I face an issue with event check-in or login?',
      a: 'You can contact the 24/7 Event Helpdesk at +91 98765 43210 or email events.support@college.edu. For on-ground event check-ins, show your digital ticket QR code at the registration desk.',
    },
    {
      q: 'How can faculty or coordinators submit new event proposals?',
      a: 'Faculty Coordinators can log into the Executive Portal with their faculty credentials to submit event proposals, schedule venues, define prize pools in INR (₹), and track live registrations.',
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', course: 'MCA', subject: '', message: '' });
    }, 1500);
  };

  return (
    <section id="support-contact" className="mt-20 pt-16 border-t border-white/10" style={{ maxWidth: '1280px', margin: '80px auto 0 auto', padding: '0 24px' }}>
      
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4"
          style={{
            background: 'rgba(212,136,15,0.12)',
            color: '#e8a025',
            border: '1px solid rgba(212,136,15,0.3)',
          }}
        >
          <LifeBuoy className="w-3.5 h-3.5" />
          Campus Support & Helpdesk Hub
        </div>
        <h2
          className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight"
          style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
        >
          Need Assistance? <span style={{ color: '#e8a025' }}>We're Here to Help</span>
        </h2>
        <p className="text-sm text-slate-400 mt-3 leading-relaxed">
          Get in touch with the Institutional Event Coordination Cell, report technical queries, or connect directly with department coordinators.
        </p>
      </div>

      {/* 4 Contact Info Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
        {/* Helpline */}
        <div
          className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
          style={{
            background: 'linear-gradient(145deg, #12151d 0%, #0c0e14 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(212,136,15,0.15)', color: '#e8a025' }}>
            <Phone className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            Emergency Helpline
          </h3>
          <p className="text-xs text-slate-400 mb-3">Toll-free student support & event inquiries</p>
          <p className="text-sm font-semibold text-amber-400 font-mono">+91 (080) 2839-4500</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">+91 98765 43210 (WhatsApp)</p>
        </div>

        {/* Email */}
        <div
          className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
          style={{
            background: 'linear-gradient(145deg, #12151d 0%, #0c0e14 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(20,184,166,0.15)', color: '#14b8a6' }}>
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            Official Email Support
          </h3>
          <p className="text-xs text-slate-400 mb-3">Email us anytime for ticket or grievance issues</p>
          <p className="text-sm font-semibold text-teal-400">events.support@college.edu</p>
          <p className="text-xs text-slate-500 mt-0.5">coordinators@college.edu</p>
        </div>

        {/* Office Location */}
        <div
          className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
          style={{
            background: 'linear-gradient(145deg, #12151d 0%, #0c0e14 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            Event Cell Office
          </h3>
          <p className="text-xs text-slate-400 mb-3">Central Student Welfare & Cultural Affairs</p>
          <p className="text-xs text-slate-300 leading-relaxed">
            Room 204, Administrative Block<br />
            Main Campus, Bengaluru, KA 560058
          </p>
        </div>

        {/* Hours */}
        <div
          className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
          style={{
            background: 'linear-gradient(145deg, #12151d 0%, #0c0e14 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white mb-1" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            Operating Hours
          </h3>
          <p className="text-xs text-slate-400 mb-3">Helpdesk desk & verification hours</p>
          <p className="text-xs font-semibold text-purple-300">Mon – Sat: 9:00 AM – 5:30 PM</p>
          <p className="text-[11px] text-emerald-400 mt-1">● Event Days: 24/7 Active Support</p>
        </div>
      </div>

      {/* 2-Column Layout: Contact Form & FAQ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        
        {/* Contact Form (7 cols) */}
        <div
          className="lg:col-span-7 p-7 sm:p-9 rounded-3xl"
          style={{
            background: 'linear-gradient(145deg, #10131a 0%, #0a0c10 100%)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,136,15,0.12)', color: '#e8a025' }}>
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                Send a Message to Event Support
              </h3>
              <p className="text-xs text-slate-400">Average response time: &lt; 2 hours during working hours</p>
            </div>
          </div>

          {formSubmitted ? (
            <div
              className="p-8 rounded-2xl text-center space-y-3"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h4 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                Query Received Successfully!
              </h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Thank you for contacting the Campus Event Management Support team. A coordinator has been assigned to your ticket and will reach out via email.
              </p>
              <button
                type="button"
                onClick={() => setFormSubmitted(false)}
                className="mt-3 px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 hover:bg-emerald-900/60 transition-colors"
              >
                Send Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohit Verma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    className="w-full px-3.5 py-2.5 rounded-xl outline-hidden focus:border-amber-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">Your Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rohit.btech@college.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    className="w-full px-3.5 py-2.5 rounded-xl outline-hidden focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">Department / Course *</label>
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    style={{ background: '#12151d', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    className="w-full px-3.5 py-2.5 rounded-xl outline-hidden focus:border-amber-400 transition-colors cursor-pointer"
                  >
                    <option value="MCA">MCA (Master of Computer Applications)</option>
                    <option value="B.Tech">B.Tech (Computer Science & Engg)</option>
                    <option value="M.Tech">M.Tech (Advanced Computing)</option>
                    <option value="MBA">MBA (Management Studies)</option>
                    <option value="BCA">BCA (Computer Applications)</option>
                    <option value="BBA">BBA (Business Administration)</option>
                    <option value="Other">Other / External Participant</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">Subject / Query Topic *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Registration confirmation issue"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                    className="w-full px-3.5 py-2.5 rounded-xl outline-hidden focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1.5">Message / Details *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your inquiry, event title, or any issue you are experiencing..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                  className="w-full px-3.5 py-2.5 rounded-xl outline-hidden focus:border-amber-400 transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-teal-400" />
                  Your query is protected by Institutional Data Privacy.
                </span>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #d4880f 0%, #e8a025 100%)',
                    color: '#0a0c0f',
                    fontWeight: 700,
                    boxShadow: '0 4px 18px rgba(212,136,15,0.3)',
                  }}
                  className="px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Support Ticket
                </button>
              </div>
            </form>
          )}
        </div>

        {/* FAQs Accordion (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold text-white" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
              Frequently Asked Questions
            </h3>
          </div>

          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl transition-all duration-200"
              style={{
                background: '#0e1118',
                border: activeFaq === idx ? '1px solid rgba(212,136,15,0.4)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer"
              >
                <span className="text-xs font-semibold text-slate-200 leading-snug">
                  {faq.q}
                </span>
                {activeFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                )}
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/5">
                  {faq.a}
                </div>
              )}
            </div>
          ))}

          {/* Quick Support Badge */}
          <div
            className="p-4 rounded-2xl flex items-center gap-3 mt-4"
            style={{
              background: 'linear-gradient(135deg, rgba(20,184,166,0.1) 0%, rgba(13,148,136,0.05) 100%)',
              border: '1px solid rgba(20,184,166,0.2)',
            }}
          >
            <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-teal-300">Need Immediate On-Ground Event Help?</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Visit the Helpdesk Desk in Central Auditorium Foyer on all active event days.
              </p>
            </div>
          </div>
        </div>

      </div>

    </section>
  );
}
