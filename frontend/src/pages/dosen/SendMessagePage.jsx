// pages/dosen/SendMessagePage.jsx
// Halaman dosen untuk kirim pesan kendala ke admin & lihat riwayat pesan

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import dosenService from '../../services/dosenService';
import {
  Send,
  Inbox,
  AlertCircle,
  Clock,
  CheckCircle2,
  Mail,
  MailOpen,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MapPin,
} from 'lucide-react';

/* ─── inline styles for animations (no Tailwind keyframes needed) ─── */
const styles = `
@keyframes scalePop {
  0%   { transform: scale(0.5); opacity: 0; }
  70%  { transform: scale(1.1); }
  100% { transform: scale(1);   opacity: 1; }
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ringPulse {
  0%,100% { box-shadow: 0 0 0 0px rgba(16,185,129,0.35); }
  50%      { box-shadow: 0 0 0 18px rgba(16,185,129,0); }
}
@keyframes drawCheck {
  to { stroke-dashoffset: 0; }
}
@keyframes particle {
  0%   { transform: translate(0,0) scale(1); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}
@keyframes overlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes overlayOut {
  from { opacity: 1; }
  to   { opacity: 0; }
}
.success-overlay { animation: overlayIn 0.3s ease forwards; }
.success-overlay.leaving { animation: overlayOut 0.4s ease forwards; }
`;

/* ─── Particle dots ─────────────────────────────────────────────── */
const PARTICLES = [
  { tx: '-80px', ty: '-90px', bg: '#10b981', delay: '0ms' },
  { tx: '80px',  ty: '-90px', bg: '#6366f1', delay: '60ms' },
  { tx: '-110px',ty: '20px',  bg: '#f59e0b', delay: '30ms' },
  { tx: '110px', ty: '20px',  bg: '#ec4899', delay: '90ms' },
  { tx: '-60px', ty: '100px', bg: '#3b82f6', delay: '20ms' },
  { tx: '60px',  ty: '100px', bg: '#10b981', delay: '70ms' },
  { tx: '0px',   ty: '-110px',bg: '#f59e0b', delay: '50ms' },
  { tx: '0px',   ty: '115px', bg: '#6366f1', delay: '40ms' },
];

function SuccessOverlay({ leaving, onDone }) {
  return (
    <>
      <style>{styles}</style>
      <div
        className={`success-overlay${leaving ? ' leaving' : ''}`}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'linear-gradient(160deg,#0f172a 0%,#1e2d78 60%,#0f172a 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 0,
        }}
        onAnimationEnd={() => leaving && onDone()}
      >
        {/* Particle burst */}
        <div style={{ position: 'relative', width: 0, height: 0, marginBottom: -80 }}>
          {PARTICLES.map((p, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: 12, height: 12,
                borderRadius: '50%',
                background: p.bg,
                '--tx': p.tx, '--ty': p.ty,
                animation: `particle 0.75s cubic-bezier(.25,.46,.45,.94) ${p.delay} both`,
              }}
            />
          ))}
        </div>

        {/* Circle + animated checkmark */}
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'rgba(16,185,129,0.15)',
          border: '3px solid rgba(16,185,129,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'scalePop 0.5s cubic-bezier(.34,1.56,.64,1) 0.1s both, ringPulse 1.8s ease 0.6s infinite',
          marginBottom: 28,
        }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="24" stroke="#10b981" strokeWidth="3" opacity="0.3" />
            <polyline
              points="14,27 22,35 38,18"
              stroke="#10b981"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray="40"
              strokeDashoffset="40"
              style={{
                animation: 'drawCheck 0.45s cubic-bezier(.45,.05,.55,.95) 0.45s forwards',
              }}
            />
          </svg>
        </div>

        {/* Text */}
        <div style={{ textAlign: 'center', animation: 'fadeSlideUp 0.5s ease 0.6s both' }}>
          <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
            Laporan Terkirim!
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6, margin: '0 0 6px', maxWidth: 280, padding: '0 16px' }}>
            Admin sudah menerima laporan Anda dan akan merespons dalam 1×24 jam kerja.
          </p>
        </div>

        {/* Progress bar */}
        <div style={{
          marginTop: 36,
          animation: 'fadeSlideUp 0.5s ease 0.7s both',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Mengalihkan ke riwayat…</p>
          <div style={{ width: 180, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg,#10b981,#6ee7b7)',
              animation: 'drawCheck 2.2s linear 0.9s both',
              strokeDasharray: 'unset',
              transformOrigin: 'left',
              width: '100%',
              transform: 'scaleX(0)',
              animationName: 'none',
              transition: 'transform 2.2s linear 0.9s',
            }}
            ref={(el) => {
              if (el) requestAnimationFrame(() => { el.style.transform = 'scaleX(1)'; });
            }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Issue type constants ──────────────────────────────────────── */
const ISSUE_TYPES = [
  { value: 'gps_not_accurate', label: 'GPS Tidak Akurat',      desc: 'Lokasi terdeteksi salah padahal sudah di kelas' },
  { value: 'session_expired',  label: 'Sesi Sudah Expired',    desc: 'Sesi kedaluwarsa sebelum sempat absen' },
  { value: 'token_invalid',    label: 'Token Tidak Valid',      desc: 'Token QR tidak dikenali sistem' },
  { value: 'already_marked',   label: 'Sudah Ditandai Hadir',  desc: 'Sistem menganggap sudah absen padahal belum' },
  { value: 'other',            label: 'Lainnya',               desc: 'Masalah lain yang tidak termasuk di atas' },
];

/* ─── SendTab ───────────────────────────────────────────────────── */
function SendTab({ onSent }) {
  const [issueType, setIssueType]   = useState('');
  const [subject,   setSubject]     = useState('');
  const [body,      setBody]        = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,     setError]       = useState(null);

  const handleSubmit = async () => {
    if (!issueType)      { setError('Pilih jenis kendala terlebih dahulu.'); return; }
    if (!subject.trim()) { setError('Judul laporan wajib diisi.'); return; }
    if (!body.trim())    { setError('Detail kendala wajib diisi.'); return; }

    setError(null);
    setSubmitting(true);
    try {
      await dosenService.sendMessage({
        judul: subject.trim(),
        isi: `[${issueType}] ${body.trim()}`,
      });
      onSent();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim pesan. Coba lagi.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Issue type */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Jenis Kendala <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {ISSUE_TYPES.map((opt) => {
            const active = issueType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setIssueType(opt.value)}
                className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-150
                  ${active
                    ? 'border-[#1E2D78] bg-indigo-50/60 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
              >
                <span className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                  ${active ? 'border-[#1E2D78]' : 'border-slate-300'}`}>
                  {active && <span className="w-2 h-2 rounded-full bg-[#1E2D78]" />}
                </span>
                <div>
                  <p className={`text-sm font-semibold ${active ? 'text-[#1E2D78]' : 'text-slate-800'}`}>{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Judul Laporan <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={120}
          placeholder="Contoh: Tidak bisa absen Kalkulus Lanjut 29 Apr"
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#1E2D78] focus:outline-none text-sm text-slate-800 placeholder-slate-400 bg-white transition-colors"
        />
        <p className="text-right text-xs text-slate-400 mt-1">{subject.length}/120</p>
      </div>

      {/* Body */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Detail Kendala <span className="text-red-500">*</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={800}
          rows={5}
          placeholder="Jelaskan kendala secara singkat: mata kuliah apa, kelas mana, jam berapa, dan apa yang terjadi…"
          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-[#1E2D78] focus:outline-none text-sm text-slate-800 placeholder-slate-400 resize-vertical bg-white transition-colors"
          style={{ fontFamily: 'inherit' }}
        />
        <p className="text-right text-xs text-slate-400 mt-1">{body.length}/800</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className={`w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-200
          ${submitting
            ? 'bg-slate-400 cursor-not-allowed scale-[0.99]'
            : 'bg-gradient-to-r from-[#1E2D78] to-[#2d3f9e] hover:opacity-90 active:scale-[0.98] shadow-lg shadow-indigo-200'
          }`}
      >
        {submitting ? (
          <><RefreshCw size={16} className="animate-spin" /> Mengirim…</>
        ) : (
          <><Send size={16} /> Kirim Laporan ke Admin</>
        )}
      </button>

      <p className="text-center text-xs text-slate-400 leading-relaxed">
        Laporan akan diterima admin dan ditindaklanjuti dalam waktu 1×24 jam kerja.
      </p>
    </div>
  );
}

/* ─── HistoryTab ────────────────────────────────────────────────── */
function HistoryTab({ refreshKey }) {
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await dosenService.getMyMessages();
        // Backend utils.OK wraps data: { message: '...', data: [...] }
        // axios wraps that in res.data, so res.data.data is the array
        const raw = res.data;
        let list = [];
        if (Array.isArray(raw))            list = raw;          // raw array
        else if (Array.isArray(raw?.data)) list = raw.data;     // { data: [] }
        else if (raw === null || raw === undefined) list = [];   // null/undefined
        setMessages(list);
      } catch (err) {
        console.error('Gagal ambil riwayat pesan:', err);
        setFetchError(err.response?.data?.message || 'Gagal memuat riwayat pesan. Coba refresh.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

  const formatDate = (dt) =>
    new Date(dt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  const statusBadge = (status) =>
    status === 'unread' ? (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Belum Dibaca Admin
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={11} />
        Sudah Dibaca
      </span>
    );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <RefreshCw size={24} className="text-slate-400 animate-spin" />
        <p className="text-sm text-slate-500">Memuat riwayat pesan…</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <p className="font-semibold text-slate-700">Gagal Memuat Riwayat</p>
        <p className="text-sm text-red-500 max-w-xs leading-relaxed">{fetchError}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
          <MailOpen size={28} className="text-slate-400" />
        </div>
        <p className="font-semibold text-slate-700">Belum Ada Pesan</p>
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed">
          Anda belum pernah mengirim laporan kendala ke admin.
          Gunakan tab <strong>Kirim Pesan</strong> untuk melaporkan masalah.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => {
        const isOpen   = expanded === msg.ID;
        const isiClean = (msg.isi || '').replace(/^\[[^\]]+\]\s*/, '');
        return (
          <div
            key={msg.ID}
            className={`bg-white rounded-xl border-2 transition-all duration-200 overflow-hidden
              ${msg.status === 'unread' ? 'border-amber-200' : 'border-slate-200'}`}
          >
            <button
              type="button"
              onClick={() => toggle(msg.ID)}
              className="w-full flex items-start justify-between gap-3 px-4 py-3.5 text-left bg-transparent border-none cursor-pointer"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={`mt-1 w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                  ${msg.status === 'unread' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                  {msg.status === 'unread'
                    ? <Mail size={16} className="text-amber-600" />
                    : <MailOpen size={16} className="text-slate-500" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 leading-snug truncate">{msg.judul}</p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <Clock size={11} />
                    {formatDate(msg.CreatedAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {statusBadge(msg.status)}
                {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
                <p className="text-sm text-slate-600 leading-relaxed">{isiClean}</p>
                {msg.session && (
                  <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 text-xs text-indigo-800">
                    <MapPin size={13} className="text-indigo-500 shrink-0" />
                    <span className="font-semibold">Kelas:</span>
                    <span>
                      {msg.session.schedule?.mata_kuliah || 'Mata Kuliah'} — {msg.session.schedule?.kelas || 'Kelas'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function SendMessagePage() {
  const navigate    = useNavigate();
  const [activeTab,   setActiveTab]   = useState('send');
  const [historyKey,  setHistoryKey]  = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);  // overlay visible
  const [leaving,     setLeaving]     = useState(false);  // trigger fade-out

  const handleSent = () => {
    setShowSuccess(true);
    setLeaving(false);
    // after 2.8 s start fade-out
    setTimeout(() => setLeaving(true), 2800);
  };

  const handleOverlayDone = () => {
    setShowSuccess(false);
    setLeaving(false);
    setHistoryKey((k) => k + 1);
    setActiveTab('history');
  };

  return (
    <>
      {/* ── Full-screen success overlay ── */}
      {showSuccess && (
        <SuccessOverlay leaving={leaving} onDone={handleOverlayDone} />
      )}

      <div className="min-h-screen bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-slate-500 font-semibold mb-4 hover:text-slate-700 transition-colors bg-transparent border-none cursor-pointer p-0"
            >
              ← Kembali
            </button>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Pesan ke Admin</h1>
            <p className="text-sm text-slate-500 mt-1">
              Laporkan kendala absensi atau kirim pesan ke administrator.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-white rounded-xl border border-slate-200 p-1 gap-1 mb-6 shadow-sm">
            {[
              { key: 'send',    label: 'Kirim Pesan', icon: Send  },
              { key: 'history', label: 'Riwayat',     icon: Inbox },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 border-none cursor-pointer
                  ${activeTab === key
                    ? 'bg-[#1E2D78] text-white shadow-md'
                    : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            {activeTab === 'send' ? (
              <SendTab onSent={handleSent} />
            ) : (
              <HistoryTab refreshKey={historyKey} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
