import { useState, useEffect, useCallback } from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';
import dosenService from '../../services/dosenService';
import { useAuth } from '../../hooks/useAuth';
import {
  MapPin, Clock, CheckCircle, AlertCircle, Navigation,
  RefreshCw, Loader2, WifiOff, Signal,
} from 'lucide-react';

// ── Haversine distance (meters) ────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatGreeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat Pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function formatDateId() {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    active:  { label: 'Sesi Aktif',   style: 'bg-green-100 text-green-700 border-green-200' },
    expired: { label: 'QR Kedaluwarsa', style: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    closed:  { label: 'Sesi Ditutup', style: 'bg-red-100 text-red-700 border-red-200' },
  };
  const s = map[status] || map.active;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${s.style}`}>
      {s.label}
    </span>
  );
}

// ── Timer countdown ────────────────────────────────────────────
function useCountdown(expiredAt) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    if (!expiredAt) return;
    const update = () => {
      const diff = new Date(expiredAt) - new Date();
      if (diff <= 0) { setDisplay('Berakhir'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setDisplay(`${m}:${String(s).padStart(2, '0')}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiredAt]);
  return display;
}

// ── Distance Bar ───────────────────────────────────────────────
function DistanceBar({ distance, radius }) {
  const pct = Math.min((distance / radius) * 100, 100);
  const inRange = distance <= radius;
  return (
    <div className={`rounded-xl p-4 border ${inRange ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${inRange ? 'bg-green-100' : 'bg-orange-100'}`}>
          <Navigation size={15} className={inRange ? 'text-green-600' : 'text-orange-500'} />
        </div>
        <div>
          <div className={`text-sm font-semibold ${inRange ? 'text-green-700' : 'text-orange-600'}`}>
            {Math.round(distance)}m dari lokasi kelas
          </div>
          <div className={`text-xs mt-0.5 ${inRange ? 'text-green-600' : 'text-orange-500'}`}>
            {inRange ? 'Dalam jangkauan — siap absen' : 'Di luar jangkauan — mendekati kelas'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="w-5">0m</span>
        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${inRange ? 'bg-green-500' : 'bg-orange-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-10 text-right">{radius}m</span>
      </div>
    </div>
  );
}

// ── Session Card ───────────────────────────────────────────────
function SessionCard({ session, onAbsen, submitting, absenDone }) {
  const { location, loading: locLoading, error: locError, getLocation } = useGeolocation();
  const [distance, setDistance] = useState(null);
  const timeLeft = useCountdown(session.expired_at);

  const fetchDistance = useCallback(async () => {
    try {
      const coords = await getLocation();
      const d = haversineDistance(
        coords.latitude, coords.longitude,
        session.lokasi_lat, session.lokasi_lng
      );
      setDistance(d);
    } catch {
      // GPS gagal
    }
  }, [getLocation, session]);

  useEffect(() => {
    fetchDistance();
    const interval = setInterval(fetchDistance, 15000);
    return () => clearInterval(interval);
  }, []);

  const inRange = distance !== null && distance <= session.radius_meter;
  const isDisabled = submitting || locLoading || !location || !inRange || absenDone;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Card Top Bar */}
      <div className="h-1 bg-gradient-to-r from-[#1E2D78] to-[#2d3f9e]" />

      <div className="p-6">
        {/* Header Row */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={session.status} />
            {absenDone && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                <CheckCircle size={11} />
                Sudah Absen
              </span>
            )}
          </div>
          {timeLeft && !absenDone && session.status === 'active' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 font-mono tabular-nums">
              <Clock size={11} />
              {timeLeft}
            </span>
          )}
        </div>

        {/* Course Title */}
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight mb-1">
          {session.mata_kuliah}
        </h2>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-3 bg-slate-50 rounded-xl border border-slate-100">
          {[
            { label: 'Kelas',   value: session.kelas },
            { label: 'Waktu',   value: `${session.jam_mulai} – ${session.jam_selesai}` },
            { label: 'Lokasi',  value: session.lokasi_nama || 'Tidak diatur' },
            { label: 'Radius',  value: `${session.radius_meter}m` },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
              <div className="text-sm font-semibold text-slate-700 leading-tight">{value}</div>
            </div>
          ))}
        </div>

        {/* GPS Loading */}
        {locLoading && !distance && (
          <div className="flex items-center gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-xl mb-4">
            <Loader2 size={18} className="text-blue-500 animate-spin flex-shrink-0" />
            <span className="text-sm text-blue-700 font-medium">Mengambil lokasi GPS...</span>
          </div>
        )}

        {/* GPS Error */}
        {locError && !distance && (
          <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl mb-4">
            <div className="flex items-center gap-2 mb-2">
              <WifiOff size={15} className="text-red-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-red-700">Gagal mendapatkan lokasi GPS</span>
            </div>
            <p className="text-xs text-red-500 mb-2">{locError}</p>
            <button
              onClick={fetchDistance}
              className="text-xs font-semibold text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Distance Bar */}
        {distance !== null && !absenDone && (
          <div className="mb-5">
            <DistanceBar distance={distance} radius={session.radius_meter} />
          </div>
        )}

        {/* Absen Button */}
        {!absenDone ? (
          <button
            onClick={() => onAbsen(session, location)}
            disabled={isDisabled}
            className={`w-full py-3.5 px-5 rounded-xl font-bold text-[15px] tracking-wide transition-all duration-200 flex items-center justify-center gap-2
              ${isDisabled
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'text-white shadow-lg shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0'
              }`}
            style={isDisabled ? {} : { background: 'linear-gradient(135deg, #1E2D78 0%, #2d3f9e 100%)' }}
          >
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> Memproses...</>
            ) : locLoading && !distance ? (
              <><Signal size={16} /> Mengambil Lokasi...</>
            ) : !location ? (
              <><MapPin size={16} /> Aktifkan GPS</>
            ) : !inRange ? (
              <><Navigation size={16} /> Di Luar Jangkauan ({distance !== null ? `${Math.round(distance)}m` : '...'})</>
            ) : (
              <><CheckCircle size={16} /> Absen Sekarang</>
            )}
          </button>
        ) : (
          /* Already attended banner */
          <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <CheckCircle size={22} className="text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-green-800">Absensi Berhasil</div>
              <div className="text-sm text-green-600 mt-0.5">
                {distance !== null ? `${Math.round(distance)} meter dari lokasi kelas` : 'Tercatat dengan baik'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── No Session ─────────────────────────────────────────────────
function NoSession({ hasSchedule }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
        <Clock size={28} className="text-blue-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">
        {hasSchedule ? 'Menunggu Sesi Diaktifkan' : 'Tidak Ada Jadwal Hari Ini'}
      </h3>
      <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
        {hasSchedule
          ? 'Anda memiliki jadwal hari ini. Silakan tunggu admin mengaktifkan sesi absensi.'
          : 'Tidak ada jadwal mengajar untuk Anda hari ini.'}
      </p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function TakeAttendancePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [absenDoneIds, setAbsenDoneIds] = useState(() => {
    try {
      const saved = localStorage.getItem('absen_done_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [toast, setToast] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const markAbsenDone = (id) => {
    setAbsenDoneIds((prev) => {
      const next = new Set([...prev, id]);
      try { localStorage.setItem('absen_done_ids', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const fetchSessions = useCallback(async () => {
    try {
      setPageError(null);
      const res = await dosenService.getActiveSession();
      const data = res.data?.data || [];
      const arr = Array.isArray(data) ? data : (data ? [data] : []);
      setSessions(arr);
      setLastUpdated(new Date());
      arr.forEach((sess) => { if (sess.sudah_absen) markAbsenDone(sess.id); });
    } catch (err) {
      if (err.response?.status === 404) {
        setSessions([]);
        setLastUpdated(new Date());
      } else if (!pageLoading) {
        setPageError('Gagal memuat data sesi. Periksa koneksi internet Anda.');
      } else {
        setSessions([]);
      }
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 20000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAbsen = async (sess, location) => {
    if (!location) return showToast('Lokasi GPS belum tersedia. Coba lagi.', 'error');
    try {
      setSubmitting(true);
      await dosenService.submitAttendance({
        session_id: sess.id,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      markAbsenDone(sess.id);
      showToast('Absensi berhasil dicatat. Selamat mengajar!', 'success');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.pesan ||
        'Gagal melakukan absensi. Silakan coba lagi.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = user?.nama || user?.name || 'Dosen';

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-xl text-sm font-semibold text-white shadow-xl whitespace-nowrap max-w-[90vw] text-center transition-all duration-300
            ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 mb-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-0.5">{formatGreeting()}</p>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">{displayName}</h1>
            <p className="text-xs text-slate-400 mt-1">{formatDateId()}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${sessions.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-xs font-semibold text-slate-600">
                {sessions.length > 0 ? `${sessions.length} sesi aktif` : 'Tidak ada sesi'}
              </span>
            </div>
            {/* Refresh button */}
            <button
              onClick={fetchSessions}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={13} />
              Perbarui
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4">
        {pageLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : pageError ? (
          <div className="bg-white rounded-2xl border border-red-100 p-10 text-center shadow-sm">
            <AlertCircle size={36} className="text-red-400 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold mb-4">{pageError}</p>
            <button
              onClick={fetchSessions}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-colors hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#1E2D78,#2d3f9e)' }}
            >
              Muat Ulang
            </button>
          </div>
        ) : sessions.length > 0 ? (
          <div className="flex flex-col gap-4">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onAbsen={handleAbsen}
                submitting={submitting}
                absenDone={absenDoneIds.has(session.id)}
              />
            ))}
            {lastUpdated && (
              <p className="text-center text-xs text-slate-400 mt-1">
                Terakhir diperbarui {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · Auto-refresh setiap 20 detik
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <NoSession hasSchedule={false} />
            {/* Info card */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-700 font-bold text-sm">i</div>
                <div>
                  <p className="text-sm font-bold text-blue-800 mb-1">Cara Melakukan Absensi</p>
                  <p className="text-xs text-blue-600 leading-relaxed">
                    Sesi absensi diaktifkan oleh admin. Halaman ini otomatis memperbarui setiap 20 detik.
                    Anda juga bisa scan QR Code yang ditampilkan admin melalui menu <strong>Scan QR</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}