import { useState, useEffect, useCallback } from 'react';
import dosenService from '../../services/dosenService';
import { CheckCircle, XCircle, Clock, CalendarDays, MapPin, AlertCircle, LayoutGrid, Table2, RefreshCw } from 'lucide-react';

const MONTHS = [
  { key: '', label: 'Semua' },
  { key: 'month', label: 'Bulan Ini' },
  { key: 'prev', label: 'Bulan Lalu' },
];

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(d) {
  if (!d) return '-';
  return new Date(d).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }) + ' WIB';
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPrevMonth() {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function StatusChip({ status }) {
  const map = {
    hadir: { label: 'Hadir',       bg: '#dcfce7', color: '#15803d', Icon: CheckCircle },
    alpha: { label: 'Tidak Hadir', bg: '#fee2e2', color: '#dc2626', Icon: XCircle },
    izin:  { label: 'Izin',        bg: '#fef9c3', color: '#92400e', Icon: Clock },
  };
  const s = map[status] || map.hadir;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: s.bg, color: s.color,
        fontSize: 11, fontWeight: 700,
        padding: '4px 10px', borderRadius: 20, whiteSpace: 'nowrap',
      }}
    >
      <s.Icon size={11} />
      {s.label}
    </span>
  );
}

function StatCard({ value, label }) {
  return (
    <div
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.12)',
        borderRadius: 14,
        padding: '14px 10px',
        textAlign: 'center',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: 500 }}>
        {label}
      </div>
    </div>
  );
}

function HistoryCard({ record }) {
  const courseName = record.mata_kuliah || record.course_name || '-';
  const classCode  = record.kelas || record.class_code || '-';
  const isHadir    = record.status === 'hadir';
  // Untuk 'hadir': tampilkan jam_absen. Untuk 'alpha': tampilkan session_date
  const displayDate = isHadir
    ? (record.jam_absen  || record.checked_in_at)
    : (record.session_date || record.jam_absen);
  const distance = record.jarak_meter ?? record.distance_meters;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '16px 18px',
        border: `1px solid ${isHadir ? '#e8ecf4' : '#fecaca'}`,
        boxShadow: '0 2px 12px rgba(30,45,120,0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: '0 0 3px',
              fontSize: 15,
              fontWeight: 700,
              color: '#1e293b',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {courseName}
          </p>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: '#64748b' }}>
            Kelas {classCode}
            {record.hari ? ` • ${record.hari}` : ''}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
            <span style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
              <CalendarDays size={12} /> {formatDate(displayDate)}
            </span>
            {isHadir && (
              <span style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={12} /> {formatTime(displayDate)}
              </span>
            )}
          </div>

          {isHadir && distance != null && distance !== undefined && (
            <span style={{ fontSize: 12, color: '#0891b2', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
              <MapPin size={12} /> {Math.round(distance)} meter dari kelas
            </span>
          )}
        </div>

        <StatusChip status={record.status || 'hadir'} />
      </div>
    </div>
  );
}

// Table for wide screen
function HistoryTable({ records }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid #e8ecf4',
        boxShadow: '0 2px 12px rgba(30,45,120,0.05)',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Tanggal', 'Mata Kuliah', 'Kelas', 'Jam Absen', 'Jarak GPS', 'Status'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#64748b',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e8ecf4',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => {
              const courseName  = r.mata_kuliah || r.course_name || '-';
              const classCode   = r.kelas || r.class_code || '-';
              const isHadir     = r.status === 'hadir';
              const displayDate = isHadir
                ? (r.jam_absen || r.checked_in_at)
                : (r.session_date || r.jam_absen);
              const distance = r.jarak_meter ?? r.distance_meters;
              return (
                <tr
                  key={r.id || i}
                  style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isHadir ? 'transparent' : '#fff8f8')}
                >
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#374151', fontWeight: 600 }}>
                    {formatDate(displayDate)}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#1e293b', fontWeight: 600 }}>
                    {courseName}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>
                    {classCode}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>
                    {isHadir ? formatTime(displayDate) : '-'}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 13, color: '#0891b2' }}>
                    {isHadir && distance != null ? `${Math.round(distance)}m` : '-'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <StatusChip status={r.status || 'hadir'} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AttendanceHistoryPage() {
  const [filterMode, setFilterMode] = useState('month'); // '' | 'month' | 'prev'
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, hadir: 0, rate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Tentukan parameter bulan berdasarkan filter
      let bulanParam = '';
      if (filterMode === 'month') bulanParam = getCurrentMonth();
      else if (filterMode === 'prev') bulanParam = getPrevMonth();

      const [histRes, statRes] = await Promise.all([
        dosenService.getAttendanceHistory(bulanParam),
        dosenService.getAttendanceStats(),
      ]);

      const rawRecords = histRes.data?.data || [];
      setRecords(Array.isArray(rawRecords) ? rawRecords : []);

      const s = statRes.data?.data;
      if (s) setStats({ total: s.total_sessions, hadir: s.attended, rate: s.attendance_rate });
    } catch {
      setError('Gagal memuat riwayat absensi. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  }, [filterMode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div style={{ padding: '0 0 16px' }}>
      {/* Stats banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E2D78 0%, #162060 100%)',
          padding: '28px 20px 36px',
          marginBottom: -20,
        }}
      >
        <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.4px' }}>
          Riwayat Absensi
        </h1>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
          Rekap kehadiran mengajar Anda
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <StatCard value={stats.total} label="Total Sesi" />
          <StatCard value={stats.hadir} label="Hadir" />
          <StatCard value={`${stats.rate}%`} label="Kehadiran" />
        </div>
      </div>

      <div style={{ padding: '32px 16px 0' }}>
        {/* Filter & view toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8 }}>
          <div
            style={{
              display: 'flex',
              background: '#e8ecf4',
              borderRadius: 12,
              padding: 3,
              gap: 2,
            }}
          >
            {MONTHS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilterMode(f.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 9,
                  border: 'none',
                  background: filterMode === f.key ? '#fff' : 'transparent',
                  color: filterMode === f.key ? '#1E2D78' : '#64748b',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: filterMode === f.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Toggle view */}
          <button
            onClick={() => setViewMode((v) => (v === 'card' ? 'table' : 'card'))}
            style={{
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '7px 12px',
              fontSize: 12, fontWeight: 600, color: '#475569',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            {viewMode === 'card' ? <><Table2 size={13} /> Tabel</> : <><LayoutGrid size={13} /> Kartu</>}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 90,
                  borderRadius: 16,
                  background: 'linear-gradient(90deg,#e8ecf4 25%,#f1f4fb 50%,#e8ecf4 75%)',
                  backgroundSize: '400% 100%',
                  animation: 'shimmer 1.4s infinite',
                }}
              />
            ))}
          </div>
        ) : error ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 24,
              textAlign: 'center',
              border: '1px solid #fecaca',
            }}
          >
            <AlertCircle size={36} color="#dc2626" style={{ marginBottom: 8 }} />
            <p style={{ color: '#dc2626', fontSize: 14, margin: '0 0 12px', fontWeight: 600 }}>
              {error}
            </p>
            <button
              onClick={fetchData}
              style={{
                background: '#1E2D78',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Coba Lagi
            </button>
          </div>
        ) : records.length === 0 ? (
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '40px 24px',
              textAlign: 'center',
              border: '1px solid #e8ecf4',
            }}
          >
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <CalendarDays size={26} color="#3b82f6" />
            </div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
              Belum ada riwayat
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b' }}>
              {filterMode === 'month'
                ? 'Belum ada absensi yang tercatat bulan ini.'
                : filterMode === 'prev'
                ? 'Tidak ada absensi pada bulan lalu.'
                : 'Riwayat absensi akan muncul setelah Anda melakukan absensi pertama.'}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          <HistoryTable records={records} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {records.map((r, i) => (
              <HistoryCard key={r.id || i} record={r} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </div>
  );
}