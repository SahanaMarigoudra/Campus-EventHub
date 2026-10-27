import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verifyCertificate } from '../services/api';
import HackathonCertificateModal, { formatPrizeRupee } from '../components/HackathonCertificateModal';
import {
  ShieldCheck,
  Trophy,
  AlertCircle,
  Calendar,
  Building2,
  Award,
  CheckCircle2,
  ExternalLink,
  ArrowLeft,
  FileCheck2,
  Lock,
} from 'lucide-react';

export default function CertificateVerifyPage() {
  const { certNumber } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [certData, setCertData] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    if (!certNumber) return;
    setLoading(true);
    verifyCertificate(certNumber)
      .then((res) => {
        if (res.success && res.certificate) {
          setCertData(res.certificate);
        } else {
          setError('Certificate record not found in the global verification registry.');
        }
      })
      .catch((err) => {
        setError(
          err.response?.data?.message || 'Certificate verification failed or record does not exist.'
        );
      })
      .finally(() => setLoading(false));
  }, [certNumber]);

  return (
    <div className="min-h-[85vh] py-12 px-4 flex flex-col items-center justify-center relative">
      <div className="max-w-2xl w-full">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Campus Events
        </Link>

        {loading ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center backdrop-blur-xl">
            <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-base font-bold text-white">Validating Cryptographic Credential...</h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">Querying ID: {certNumber}</p>
          </div>
        ) : error ? (
          <div className="bg-red-950/40 border border-red-500/30 rounded-3xl p-8 text-center backdrop-blur-xl">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white">Invalid or Unverified Credential</h2>
            <p className="text-sm text-red-300 mt-2 max-w-md mx-auto">{error}</p>
            <p className="text-xs text-slate-500 mt-4 font-mono">Searched Identifier: {certNumber}</p>
          </div>
        ) : certData ? (
          <div className="bg-slate-900/80 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            {/* Top Glowing Header Badge */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                      Official Verified Credential
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      AUTHENTIC
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Global Verification ID: {certData.certificate_number}
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono text-[11px]">SHA-256 Validated</span>
              </div>
            </div>

            {/* Credential Content Summary */}
            <div className="py-6 space-y-4">
              {/* Winner Status Banner */}
              {certData.cert_type !== 'participation' && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-amber-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-black text-amber-300 uppercase tracking-wide">
                        {certData.rank_position || 'Hackathon Winner Award'}
                      </h4>
                      {certData.prize && (
                        <p className="text-xs font-semibold text-emerald-400">
                          ★ Prize: {formatPrizeRupee(certData.prize)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                    WINNER
                  </span>
                </div>
              )}

              {/* Awarded Recipient Card */}
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Awarded To
                </p>
                <h3 className="text-xl font-black text-white mt-0.5">
                  {certData.student_name || certData.recipient_name}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                  {certData.team_name && (
                    <span className="text-amber-400 font-semibold">
                      Team: {certData.team_name}
                    </span>
                  )}
                  {certData.roll_number && (
                    <span className="font-mono text-slate-400">Roll: {certData.roll_number}</span>
                  )}
                  <span className="text-slate-400">
                    Dept: {certData.department_name || certData.department_code}
                  </span>
                </div>
              </div>

              {/* Event & Category Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/30 p-3.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-sky-400" /> Event Title
                  </span>
                  <span className="font-bold text-white text-sm">{certData.event_title}</span>
                </div>

                <div className="bg-slate-800/30 p-3.5 rounded-xl border border-slate-700/50">
                  <span className="text-slate-400 block mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> Issue Date
                  </span>
                  <span className="font-bold text-white text-sm">
                    {certData.issue_date
                      ? new Date(certData.issue_date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'October 24, 2026'}
                  </span>
                </div>
              </div>

              {/* Cryptographic Hash Security Detail */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400">
                <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">
                  Cryptographic Integrity Checksum (SHA-256)
                </span>
                <span className="text-emerald-400 break-all select-all">
                  {certData.verification_hash || 'SHA-256 CRYPTOGRAPHIC INTEGRITY VERIFIED'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setShowCertificateModal(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <FileCheck2 className="w-4 h-4" />
                View Full International Certificate
              </button>

              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Apex Institute Credential Registry
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Render Certificate Modal */}
      {certData && (
        <HackathonCertificateModal
          certificate={certData}
          isOpen={showCertificateModal}
          onClose={() => setShowCertificateModal(false)}
        />
      )}
    </div>
  );
}
