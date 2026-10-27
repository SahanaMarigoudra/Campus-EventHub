import React, { useState, useRef } from 'react';
import {
  Trophy,
  Award,
  Download,
  Share2,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  X,
  ExternalLink,
  Sparkles,
  Copy,
  Printer,
  Eye,
} from 'lucide-react';

export const formatPrizeRupee = (prize) => {
  if (!prize) return '';
  let str = String(prize).trim();
  // Strip any dollar amounts and separator: "$1,000 / ", "$5,000 / ", "$500 / "
  str = str.replace(/\$[\d,]+\s*(?:\/|\s*\/\s*)\s*/gi, '');
  // If there is any remaining $ symbol, convert to ₹
  str = str.replace(/\$/g, '₹');
  // If purely a number without currency symbol e.g. "25000", format with ₹
  if (/^\d+$/.test(str)) {
    str = `₹${Number(str).toLocaleString('en-IN')}`;
  }
  return str;
};

export default function HackathonCertificateModal({ certificate, isOpen, onClose }) {
  const [themeMode, setThemeMode] = useState('dark'); // 'dark' (obsidian tech) or 'light' (royal ivory parchment)
  const [copied, setCopied] = useState(false);
  const [showVerifyDetails, setShowVerifyDetails] = useState(false);

  if (!isOpen || !certificate) return null;

  const isWinner = ['winner', 'runner_up', 'second_runner_up', 'special_award'].includes(
    certificate.cert_type
  );

  const getRankMeta = () => {
    switch (certificate.cert_type) {
      case 'winner':
        return {
          rankLabel: certificate.rank_position || '1st Place • Grand Champion',
          headerTitle: 'CERTIFICATE OF EXTRAORDINARY ACHIEVEMENT',
          subTitle: 'INTERNATIONAL HACKATHON & INNOVATION GRAND PRIX',
          badgeColor: '#f59e0b',
          accentGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%)',
          borderColor: 'rgba(245, 158, 11, 0.45)',
          glowColor: 'rgba(245, 158, 11, 0.25)',
          tierBadge: 'GRAND CHAMPION',
          icon: <Trophy className="w-8 h-8 text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]" />,
          sealRing: '#f59e0b',
        };
      case 'runner_up':
        return {
          rankLabel: certificate.rank_position || '2nd Place • First Runner-Up',
          headerTitle: 'CERTIFICATE OF MERIT & DISTINCTION',
          subTitle: 'INTERNATIONAL HACKATHON FIRST RUNNER-UP',
          badgeColor: '#cbd5e1',
          accentGradient: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 50%, #64748b 100%)',
          borderColor: 'rgba(203, 213, 225, 0.45)',
          glowColor: 'rgba(148, 163, 184, 0.25)',
          tierBadge: 'FIRST RUNNER-UP',
          icon: <Award className="w-8 h-8 text-slate-200 drop-shadow-[0_0_12px_rgba(203,213,225,0.6)]" />,
          sealRing: '#94a3b8',
        };
      case 'second_runner_up':
        return {
          rankLabel: certificate.rank_position || '3rd Place • Second Runner-Up',
          headerTitle: 'CERTIFICATE OF EXCELLENCE',
          subTitle: 'INTERNATIONAL HACKATHON SECOND RUNNER-UP',
          badgeColor: '#d97706',
          accentGradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #92400e 100%)',
          borderColor: 'rgba(217, 119, 6, 0.45)',
          glowColor: 'rgba(217, 119, 6, 0.25)',
          tierBadge: 'SECOND RUNNER-UP',
          icon: <Award className="w-8 h-8 text-amber-500 drop-shadow-[0_0_12px_rgba(217,119,6,0.6)]" />,
          sealRing: '#d97706',
        };
      case 'special_award':
        return {
          rankLabel: certificate.rank_position || 'Special Innovation Award',
          headerTitle: 'CERTIFICATE OF TECHNICAL INNOVATION',
          subTitle: 'JURY DISTINCTION & SPECIAL CATEGORY HONORS',
          badgeColor: '#10b981',
          accentGradient: 'linear-gradient(135deg, #06b6d4 0%, #10b981 50%, #047857 100%)',
          borderColor: 'rgba(16, 185, 129, 0.45)',
          glowColor: 'rgba(16, 185, 129, 0.25)',
          tierBadge: 'INNOVATION AWARD',
          icon: <Sparkles className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]" />,
          sealRing: '#10b981',
        };
      default:
        return {
          rankLabel: 'Official Participant',
          headerTitle: 'CERTIFICATE OF PARTICIPATION',
          subTitle: 'COLLEGIATE & INTERNATIONAL TECHNICAL SUMMIT',
          badgeColor: '#38bdf8',
          accentGradient: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
          borderColor: 'rgba(56, 189, 248, 0.35)',
          glowColor: 'rgba(56, 189, 248, 0.2)',
          tierBadge: 'VERIFIED DELEGATE',
          icon: <Award className="w-8 h-8 text-sky-400" />,
          sealRing: '#38bdf8',
        };
    }
  };

  const meta = getRankMeta();
  const verifyUrl = `${window.location.origin}/verify-certificate/${certificate.certificate_number}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareLinkedIn = () => {
    const text = `Honored to receive the ${meta.rankLabel} at ${certificate.event_title || 'the International Hackathon'}! Verified Credential ID: ${certificate.certificate_number}`;
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}&summary=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareTwitter = () => {
    const text = `🏆 Proud to announce that I was awarded ${meta.rankLabel} in ${certificate.event_title}! Check out my official verified international hackathon certificate:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(verifyUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const issueDateFormatted = certificate.issue_date
    ? new Date(certificate.issue_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'October 24, 2026';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in print:p-0 print:bg-white print:static print:h-auto">
      {/* Print-specific style tag */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-hackathon-certificate, #printable-hackathon-certificate * {
            visibility: visible;
          }
          #printable-hackathon-certificate {
            position: fixed;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: 4px double #d4af37 !important;
            background: #ffffff !important;
            color: #000000 !important;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-5xl my-4 flex flex-col items-center">
        {/* Floating Top Control Bar (Hidden during print) */}
        <div className="no-print w-full flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3.5 mb-3 shadow-2xl backdrop-blur-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Official International Credential
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Authenticated
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                ID: {certificate.certificate_number}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Theme Toggle */}
            <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setThemeMode('dark')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  themeMode === 'dark'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Obsidian Mode
              </button>
              <button
                onClick={() => setThemeMode('light')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  themeMode === 'light'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Royal Ivory
              </button>
            </div>

            {/* Print / Save */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Print or save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print / PDF</span>
            </button>

            {/* Copy Verification Link */}
            <button
              onClick={handleCopyLink}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            {/* Share Menu */}
            <button
              onClick={handleShareLinkedIn}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 flex items-center gap-1 transition-all cursor-pointer"
              title="Share on LinkedIn"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>LinkedIn</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── THE CERTIFICATE CANVAS (PRINTABLE) ── */}
        <div
          id="printable-hackathon-certificate"
          style={{
            background:
              themeMode === 'dark'
                ? 'radial-gradient(ellipse at 50% 20%, #111528 0%, #090c15 65%, #05070c 100%)'
                : 'radial-gradient(ellipse at 50% 30%, #fffdf8 0%, #fbf7ee 70%, #f3ede0 100%)',
            color: themeMode === 'dark' ? '#f8fafc' : '#1e293b',
            borderColor: meta.badgeColor,
            boxShadow:
              themeMode === 'dark'
                ? `0 25px 70px rgba(0,0,0,0.9), 0 0 40px ${meta.glowColor}`
                : '0 20px 60px rgba(0,0,0,0.15)',
          }}
          className="w-full rounded-3xl p-6 sm:p-10 border-2 relative overflow-hidden transition-all duration-300 select-none print:border-4 print:rounded-none"
        >
          {/* Subtle Guilloche / Security Grid Overlay */}
          <div
            style={{
              backgroundImage:
                themeMode === 'dark'
                  ? 'radial-gradient(rgba(245, 158, 11, 0.04) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px)'
                  : 'radial-gradient(rgba(180, 130, 20, 0.05) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px',
            }}
            className="absolute inset-0 pointer-events-none"
          />

          {/* Ornate Double Border with Security Microtext */}
          <div
            style={{
              borderColor: meta.borderColor,
              borderStyle: 'double',
              borderWidth: '4px',
            }}
            className="rounded-2xl p-6 sm:p-8 relative"
          >
            {/* Four Corner Flourishes */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400/80 pointer-events-none" />
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400/80 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400/80 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400/80 pointer-events-none" />

            {/* Header: Organization & Summit Identity */}
            <div className="text-center relative z-10 mb-5">
              <div className="flex items-center justify-center gap-3 mb-2">
                {/* Left Emblem */}
                <div
                  style={{ background: meta.accentGradient }}
                  className="w-10 h-10 rounded-xl p-0.5 shadow-lg flex items-center justify-center"
                >
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                  </div>
                </div>

                <div>
                  <h4
                    className="text-[11px] sm:text-xs font-black tracking-[0.25em] uppercase"
                    style={{ color: meta.badgeColor }}
                  >
                    Global Innovation & Hackathon Alliance
                  </h4>
                  <p
                    className={`text-[9px] sm:text-[10px] tracking-widest uppercase font-semibold ${
                      themeMode === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Apex Institute of Technology • Division of Advanced Engineering
                  </p>
                </div>

                {/* Right Trophy */}
                <div
                  style={{ background: meta.accentGradient }}
                  className="w-10 h-10 rounded-xl p-0.5 shadow-lg flex items-center justify-center"
                >
                  <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400">
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
              </div>

              {/* Security Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 border border-amber-500/25 text-amber-400 mb-2">
                <span>VERIFIED CRYPTOGRAPHIC CREDENTIAL</span>
                <span>•</span>
                <span>GLOBAL REGISTRY</span>
              </div>

              {/* Main Certificate Title */}
              <h1
                style={{
                  fontFamily: 'Outfit, serif, system-ui',
                  letterSpacing: '0.04em',
                }}
                className={`text-xl sm:text-3xl font-extrabold uppercase mt-1 ${
                  themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                }`}
              >
                {meta.headerTitle}
              </h1>

              <p
                style={{ color: meta.badgeColor }}
                className="text-xs sm:text-sm font-semibold tracking-widest uppercase mt-0.5"
              >
                {meta.subTitle}
              </p>
            </div>

            {/* Distinctive Rank Ribbon Banner */}
            <div className="my-5 flex items-center justify-center">
              <div
                style={{
                  background:
                    themeMode === 'dark'
                      ? 'linear-gradient(90deg, transparent, rgba(245,158,11,0.15), transparent)'
                      : 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)',
                  borderTop: `1px solid ${meta.borderColor}`,
                  borderBottom: `1px solid ${meta.borderColor}`,
                }}
                className="w-full py-2.5 px-4 flex items-center justify-center gap-3 text-center"
              >
                {meta.icon}
                <div>
                  <span
                    style={{
                      background: meta.accentGradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                    className="text-base sm:text-xl font-black tracking-wide uppercase block"
                  >
                    {meta.rankLabel}
                  </span>
                  {certificate.prize && (
                    <span className="text-xs font-bold text-emerald-400 drop-shadow-sm block">
                      ★ Prize: {formatPrizeRupee(certificate.prize)} ★
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Recipient Details Section */}
            <div className="text-center my-6 relative z-10">
              <p
                className={`text-xs sm:text-sm italic font-serif ${
                  themeMode === 'dark' ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                This prestigious international credential of technical excellence is conferred upon
              </p>

              {/* Recipient Name */}
              <h2
                style={{
                  fontFamily: 'Outfit, Georgia, serif',
                  background:
                    themeMode === 'dark'
                      ? 'linear-gradient(135deg, #ffffff 0%, #fbbf24 60%, #f59e0b 100%)'
                      : 'linear-gradient(135deg, #0f172a 0%, #b45309 80%, #78350f 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
                className="text-2xl sm:text-4xl font-black my-2.5 tracking-tight"
              >
                {certificate.recipient_name || certificate.student_name}
              </h2>

              {/* Team and Affiliation */}
              <div
                className={`flex flex-wrap items-center justify-center gap-2 text-xs font-medium ${
                  themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                {certificate.team_name && (
                  <span className="font-semibold px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300">
                    Team: {certificate.team_name}
                  </span>
                )}
                {certificate.roll_number && (
                  <span>
                    Roll: <strong className="font-mono">{certificate.roll_number}</strong>
                  </span>
                )}
                <span>•</span>
                <span>
                  Department:{' '}
                  <strong>
                    {certificate.department_name || certificate.department_code || 'MCA'}
                  </strong>
                </span>
              </div>

              {/* Official Citation Text */}
              <p
                className={`text-xs sm:text-sm max-w-2xl mx-auto mt-4 leading-relaxed ${
                  themeMode === 'dark' ? 'text-slate-300' : 'text-slate-700'
                }`}
              >
                for demonstrating exceptional algorithmic execution, innovative system architecture,
                and superior technical craft in{' '}
                <strong
                  className={themeMode === 'dark' ? 'text-white' : 'text-slate-950 font-bold'}
                >
                  "{certificate.event_title}"
                </strong>{' '}
                held on <span className="font-semibold">{issueDateFormatted}</span>.
              </p>

              {/* Track / Challenge Tag */}
              {certificate.track && (
                <div className="mt-3">
                  <span
                    style={{
                      borderColor: meta.borderColor,
                      background:
                        themeMode === 'dark'
                          ? 'rgba(255,255,255,0.04)'
                          : 'rgba(212,175,55,0.1)',
                    }}
                    className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border uppercase"
                  >
                    Track: {certificate.track}
                  </span>
                </div>
              )}
            </div>

            {/* Bottom Footer: Signatures, Seal, & Verification QR */}
            <div
              style={{
                borderTop: `1px solid ${
                  themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }`,
              }}
              className="mt-8 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-center relative z-10"
            >
              {/* Signature 1: Hackathon General Chair */}
              <div className="flex flex-col items-center">
                {/* Authentic Dummy Calligraphic Handwritten Signature */}
                <div className="h-12 flex items-center justify-center relative mb-1">
                  <svg
                    className="w-36 h-12"
                    viewBox="0 0 180 55"
                    fill="none"
                    style={{
                      transform: 'rotate(-2deg)',
                      filter: themeMode === 'dark' ? 'drop-shadow(0 0 4px rgba(245,158,11,0.25))' : 'none',
                    }}
                  >
                    {/* Realistic cursive letter strokes - Dr. Ramesh Sharma */}
                    <path
                      d="M 16 38 C 12 28, 16 11, 25 8 C 33 6, 38 15, 32 25 C 26 33, 20 36, 32 37 C 42 38, 50 25, 55 18 C 59 13, 64 24, 69 20 C 73 16, 77 23, 82 19 C 86 15, 90 22, 95 17 C 100 13, 105 8, 107 15 C 108 23, 103 30, 110 28 C 117 26, 122 16, 129 18 C 135 20, 142 14, 150 16"
                      stroke={themeMode === 'dark' ? '#fbbf24' : '#1e3a8a'}
                      strokeWidth="2.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Intermediate pen loops & dots */}
                    <path
                      d="M 29 21 C 39 17, 47 22, 45 29 M 106 14 C 112 10, 119 11, 116 20"
                      stroke={themeMode === 'dark' ? '#fbbf24' : '#1e3a8a'}
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                    {/* Sweeping signature underline flourish with pen tap dots */}
                    <path
                      d="M 22 43 C 55 42, 105 44, 156 34 C 162 33, 153 39, 134 42"
                      stroke={themeMode === 'dark' ? '#f59e0b' : '#2563eb'}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="162" cy="33" r="1.6" fill={themeMode === 'dark' ? '#fbbf24' : '#1e3a8a'} />
                    <circle cx="168" cy="32" r="1.1" fill={themeMode === 'dark' ? '#fbbf24' : '#1e3a8a'} />
                  </svg>
                </div>
                <div
                  style={{
                    borderTop: `1px solid ${
                      themeMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                    }`,
                  }}
                  className="w-36 pt-1 text-[11px]"
                >
                  <p
                    className={`font-bold ${
                      themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Dr. Ramesh Sharma
                  </p>
                  <p
                    className={`text-[9px] uppercase tracking-wider ${
                      themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Hackathon General Chair
                  </p>
                </div>
              </div>

              {/* Center: Official 3D Embossed Gold Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center">
                  {/* Outer Ribbon tails */}
                  <div
                    style={{
                      background: meta.accentGradient,
                    }}
                    className="w-20 h-20 rounded-full p-1 shadow-2xl flex items-center justify-center"
                  >
                    <div
                      style={{
                        background:
                          themeMode === 'dark'
                            ? 'radial-gradient(circle, #1a2035 0%, #0c101d 100%)'
                            : 'radial-gradient(circle, #fef3c7 0%, #fde68a 100%)',
                        border: `2px dashed ${meta.badgeColor}`,
                      }}
                      className="w-full h-full rounded-full flex flex-col items-center justify-center text-center p-1"
                    >
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <span className="text-[7px] font-black uppercase tracking-tighter text-amber-500 mt-0.5">
                        GLOBAL VERIFIED
                      </span>
                      <span
                        className={`text-[6px] font-mono ${
                          themeMode === 'dark' ? 'text-slate-400' : 'text-slate-700'
                        }`}
                      >
                        {issueDateFormatted.split(' ').pop()}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  style={{ color: meta.badgeColor }}
                  className="text-[9px] font-mono tracking-widest font-bold uppercase mt-2"
                >
                  ACCREDITED HACKATHON SEAL
                </span>
              </div>

              {/* Signature 2: Dean of Technology & Jury Lead */}
              <div className="flex flex-col items-center">
                {/* Authentic Dummy Calligraphic Handwritten Signature */}
                <div className="h-12 flex items-center justify-center relative mb-1">
                  <svg
                    className="w-36 h-12"
                    viewBox="0 0 180 55"
                    fill="none"
                    style={{
                      transform: 'rotate(1.5deg)',
                      filter: themeMode === 'dark' ? 'drop-shadow(0 0 4px rgba(245,158,11,0.25))' : 'none',
                    }}
                  >
                    {/* Realistic cursive letter strokes - Prof. Anirudh Sen */}
                    <path
                      d="M 18 41 C 26 23, 35 9, 41 6 C 45 4, 48 14, 43 32 M 28 23 C 39 21, 53 23, 61 17 C 66 14, 70 24, 75 19 C 80 14, 84 23, 89 18 C 94 13, 98 21, 103 17 C 109 12, 116 7, 114 18 C 112 27, 121 25, 128 19 C 135 14, 142 23, 151 16"
                      stroke={themeMode === 'dark' ? '#fbbf24' : '#1e3a8a'}
                      strokeWidth="2.3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Cross flourish & loop accents */}
                    <path
                      d="M 37 20 C 51 17, 64 19, 73 15 M 112 13 C 118 9, 126 11, 123 20"
                      stroke={themeMode === 'dark' ? '#fbbf24' : '#1e3a8a'}
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                    {/* Decisive sweeping under-flourish & pen dots */}
                    <path
                      d="M 30 46 C 68 43, 114 45, 158 36 C 163 35, 154 41, 135 44"
                      stroke={themeMode === 'dark' ? '#f59e0b' : '#2563eb'}
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="164" cy="35" r="1.6" fill={themeMode === 'dark' ? '#fbbf24' : '#1e3a8a'} />
                    <circle cx="170" cy="34" r="1.1" fill={themeMode === 'dark' ? '#fbbf24' : '#1e3a8a'} />
                  </svg>
                </div>
                <div
                  style={{
                    borderTop: `1px solid ${
                      themeMode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                    }`,
                  }}
                  className="w-36 pt-1 text-[11px]"
                >
                  <p
                    className={`font-bold ${
                      themeMode === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {certificate.issuer_name && certificate.issuer_name !== 'Dr. Ramesh Sharma'
                      ? certificate.issuer_name
                      : 'Prof. Anirudh Sen'}
                  </p>
                  <p
                    className={`text-[9px] uppercase tracking-wider ${
                      themeMode === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Dean of Technology & Jury Lead
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Strip: QR Code & Verification Digest */}
            <div
              style={{
                background:
                  themeMode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${
                  themeMode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
                }`,
              }}
              className="mt-6 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-[10px]"
            >
              <div className="flex items-center gap-3">
                <div className="p-1 rounded-lg bg-white text-slate-950 shadow-sm flex items-center justify-center">
                  <QrCode className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-amber-400">CREDENTIAL ID:</span>
                    <span className="font-mono font-bold">{certificate.certificate_number}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    <span>Tamper-Proof SHA-256:</span>
                    <span className="font-mono text-[9px] text-emerald-400">
                      {certificate.verification_hash || '7F8B9A1C2E4D6E8F...'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 justify-end text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Publicly Verifiable Global Credential</span>
                </div>
                <p className="text-slate-400 text-[9px]">
                  Issued under Apex Academic Event Regulations & Global Hackathon Standards
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Bottom Social & Verification Bar (No-print) */}
        <div className="no-print mt-3 w-full flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-2">
          <div className="flex items-center gap-2">
            <span>Share your win with the world:</span>
            <button
              onClick={handleShareLinkedIn}
              className="text-blue-400 hover:text-blue-300 font-semibold underline flex items-center gap-1 cursor-pointer"
            >
              LinkedIn <ExternalLink className="w-3 h-3" />
            </button>
            <span>•</span>
            <button
              onClick={handleShareTwitter}
              className="text-sky-400 hover:text-sky-300 font-semibold underline flex items-center gap-1 cursor-pointer"
            >
              X (Twitter) <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono">
              Direct Verification: {window.location.origin}/verify-certificate/{certificate.certificate_number}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
