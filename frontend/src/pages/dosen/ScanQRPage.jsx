import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import dosenService from '../../services/dosenService';
import { useGeolocation } from '../../hooks/useGeolocation';

export default function ScanQRPage() {
  const navigate = useNavigate();
  const { getLocation } = useGeolocation();

  const [mode, setMode] = useState('scanner');
  const [manualToken, setManualToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [scannerReady, setScannerReady] = useState(false);

  const scannerInstanceRef = useRef(null);
  const qrReaderRef = useRef(null);

  const mapErrorMessage = (errCode, errMessage) => {
    const errorMap = {
      TOKEN_INVALID: '❌ QR Code tidak valid atau tidak ditemukan. Pastikan kamu scan QR yang benar.',
      SESSION_CLOSED: '⛔ Sesi sudah ditutup oleh admin. Hubungi admin untuk bantuan.',
      SESSION_EXPIRED: '⏰ QR Code sudah kadaluarsa. Minta admin untuk mengaktifkan sesi baru.',
      SCHEDULE_MISMATCH: '🕐 Bukan waktu jadwal yang tepat. Absensi hanya bisa dilakukan sesuai jadwal.',
      ALREADY_SUBMITTED: '✓ Kamu sudah melakukan absensi untuk sesi ini sebelumnya.',
      OUT_OF_RADIUS: '📍 Kamu terlalu jauh dari kelas untuk absen. Harap mendekat ke ruang kelas.',
    };
    return errorMap[errCode] || errMessage || 'Terjadi kesalahan. Coba lagi nanti.';
  };

  // Initialize & cleanup scanner
  useEffect(() => {
    if (mode !== 'scanner') {
      // Cleanup scanner when switching to manual mode
      const cleanup = async () => {
        if (scannerInstanceRef.current) {
          try {
            await scannerInstanceRef.current.stop();
          } catch (e) {}
          scannerInstanceRef.current = null;
        }
      };
      cleanup();
      setScannerReady(false);
      return;
    }

    const startScanner = async () => {
      if (!qrReaderRef.current) return;

      try {
        const scanner = new Html5Qrcode('qr-reader');
        scannerInstanceRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
          },
          (decodedText) => handleQRSuccess(decodedText),
          () => {} // suppress error logs
        );

        setScannerReady(true);
        setCameraError(null);
      } catch (err) {
        let errorMsg = 'Gagal membuka kamera. Pastikan izin kamera sudah diaktifkan.';

        if (err.name === 'NotAllowedError') {
          errorMsg = '📷 Izin akses kamera ditolak. Aktifkan izin kamera di pengaturan perangkat Anda.';
        } else if (err.name === 'NotFoundError') {
          errorMsg = '📷 Tidak ada perangkat kamera ditemukan pada perangkat ini.';
        } else if (err.name === 'NotSupportedError') {
          errorMsg = '📷 Browser Anda tidak mendukung akses kamera.';
        }

        setCameraError(errorMsg);
        setScannerReady(false);
      }
    };

    startScanner();

    return () => {
      const cleanup = async () => {
        if (scannerInstanceRef.current) {
          try {
            await scannerInstanceRef.current.stop();
          } catch (e) {}
          scannerInstanceRef.current = null;
        }
      };
      cleanup();
    };
  }, [mode]);

  const handleQRSuccess = async (decodedText) => {
    if (submitting) return;
    if (scannerInstanceRef.current) {
      try {
        await scannerInstanceRef.current.stop();
      } catch (e) {}
    }
    submitQRToken(decodedText);
  };

  const submitQRToken = async (token) => {
    if (!token || !token.trim()) {
      setResult({
        success: false,
        message: '⚠️ Token QR tidak boleh kosong.',
      });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const location = await getLocation().catch(() => null);

      if (!location) {
        setResult({
          success: false,
          message: '📍 Gagal mendapatkan lokasi GPS. Pastikan GPS/lokasi sudah diaktifkan.',
        });
        setSubmitting(false);

        // Restart scanner
        if (mode === 'scanner' && scannerInstanceRef.current) {
          try {
            await scannerInstanceRef.current.start(
              { facingMode: 'environment' },
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
              },
              (decodedText) => handleQRSuccess(decodedText),
              () => {}
            );
            setScannerReady(true);
          } catch (e) {}
        }
        return;
      }

      await dosenService.submitAttendanceByToken({
        token: token.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
      });

      setResult({
        success: true,
        message: '✅ Absensi berhasil dicatat! Selamat mengajar! 🎉',
      });

      setTimeout(() => navigate('/dosen/riwayat'), 2500);
    } catch (err) {
      const backendErr = err.response?.data;
      const errorCode = backendErr?.kode_error;
      const errorMessage = backendErr?.pesan;

      setResult({
        success: false,
        message: mapErrorMessage(errorCode, errorMessage),
      });

      // Restart scanner
      if (mode === 'scanner' && scannerInstanceRef.current) {
        try {
          await scannerInstanceRef.current.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => handleQRSuccess(decodedText),
            () => {}
          );
          setScannerReady(true);
        } catch (e) {}
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    submitQRToken(manualToken);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
      {/* Scanner Area */}
      <div
        ref={qrReaderRef}
        style={{
          flex: '0 0 auto',
          background: '#0f172a',
          position: 'relative',
          overflow: 'hidden',
          aspectRatio: '1 / 1',
          maxHeight: '55vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {cameraError ? (
          <div
            style={{
              textAlign: 'center',
              padding: 24,
              color: '#f87171',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              width: '100%',
            }}
          >
            <div style={{ fontSize: 40 }}>📷</div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, maxWidth: 280 }}>
              {cameraError}
            </p>
            <button
              onClick={() => {
                setCameraError(null);
                setScannerReady(false);
                setMode('scanner');
              }}
              style={{
                marginTop: 8,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <>
            {/* QR Reader Container */}
            <div
              id="qr-reader"
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
              }}
            />

            {/* Scanner Status */}
            {mode === 'scanner' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: scannerReady ? 'rgba(34, 197, 94, 0.9)' : 'rgba(100, 116, 139, 0.9)',
                  backdropFilter: 'blur(6px)',
                  color: '#fff',
                  fontSize: 12,
                  padding: '8px 14px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  zIndex: 10,
                }}
              >
                {scannerReady ? (
                  <>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#fff',
                        animation: 'pulse 1.5s ease-in-out infinite',
                      }}
                    />
                    Siap Scan
                  </>
                ) : (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                    Inisialisasi...
                  </>
                )}
              </div>
            )}

            {/* Corner Frame */}
            {['tl', 'tr', 'bl', 'br'].map((corner) => (
              <div
                key={corner}
                style={{
                  position: 'absolute',
                  width: 30,
                  height: 30,
                  borderColor: '#22c55e',
                  borderStyle: 'solid',
                  borderWidth: 0,
                  zIndex: 11,
                  ...(corner === 'tl'
                    ? {
                        top: 40,
                        left: 40,
                        borderTopWidth: 3,
                        borderLeftWidth: 3,
                        borderRadius: '6px 0 0 0',
                      }
                    : corner === 'tr'
                    ? {
                        top: 40,
                        right: 40,
                        borderTopWidth: 3,
                        borderRightWidth: 3,
                        borderRadius: '0 6px 0 0',
                      }
                    : corner === 'bl'
                    ? {
                        bottom: 40,
                        left: 40,
                        borderBottomWidth: 3,
                        borderLeftWidth: 3,
                        borderRadius: '0 0 0 6px',
                      }
                    : {
                        bottom: 40,
                        right: 40,
                        borderBottomWidth: 3,
                        borderRightWidth: 3,
                        borderRadius: '0 0 6px 0',
                      }),
                }}
              />
            ))}

            {/* Scan Line */}
            {mode === 'scanner' && scannerReady && (
              <div
                style={{
                  position: 'absolute',
                  left: 44,
                  right: 44,
                  height: 2,
                  background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
                  animation: 'scanline 2.4s ease-in-out infinite',
                  zIndex: 11,
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Controls & Info */}
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        {/* Result Toast */}
        {result && (
          <div
            style={{
              background: result.success ? '#f0fdf4' : '#fef2f2',
              border: `1.5px solid ${result.success ? '#86efac' : '#fca5a5'}`,
              borderRadius: 14,
              padding: '14px 16px',
              textAlign: 'center',
              animation: 'slideDown 0.3s ease-out',
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 4 }}>
              {result.success ? '✅' : '❌'}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                color: result.success ? '#15803d' : '#dc2626',
                lineHeight: 1.5,
              }}
            >
              {result.message}
            </p>
          </div>
        )}

        {/* Mode Toggle / Input Area */}
        {mode === 'scanner' ? (
          <>
            <button
              disabled={submitting}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                border: '1.5px solid #e2e8f0',
                background: submitting ? '#f1f5f9' : '#fff',
                fontSize: 14,
                fontWeight: 700,
                color: '#1e293b',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s',
              }}
            >
              🔦 Nyalakan Senter
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>ATAU</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            <button
              onClick={() => setMode('manual')}
              disabled={submitting}
              style={{
                background: 'none',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: submitting ? '#cbd5e1' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 0',
                transition: 'color 0.2s',
              }}
            >
              ⌨️ Masukkan Kode Manual
            </button>
          </>
        ) : (
          <>
            <div>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#374151',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Kode Token QR
              </label>
              <input
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !submitting && manualToken.trim()) {
                    handleManualSubmit();
                  }
                }}
                placeholder="Masukkan token dari admin…"
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #e2e8f0',
                  fontSize: 14,
                  fontFamily: 'monospace',
                  outline: 'none',
                  color: submitting ? '#cbd5e1' : '#1e293b',
                  boxSizing: 'border-box',
                  letterSpacing: '0.05em',
                  backgroundColor: submitting ? '#f9fafb' : '#fff',
                  transition: 'all 0.2s',
                }}
              />
            </div>

            <button
              onClick={handleManualSubmit}
              disabled={submitting || !manualToken.trim()}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                border: 'none',
                background:
                  submitting || !manualToken.trim()
                    ? '#94a3b8'
                    : 'linear-gradient(135deg,#1E2D78,#2d3f9e)',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: submitting || !manualToken.trim() ? 'not-allowed' : 'pointer',
                boxShadow:
                  !submitting && manualToken.trim()
                    ? '0 6px 20px rgba(30,45,120,0.3)'
                    : 'none',
                transition: 'all 0.2s',
              }}
            >
              {submitting ? '⏳ Memproses…' : '✅ Konfirmasi Absensi'}
            </button>

            <button
              onClick={() => {
                setMode('scanner');
                setResult(null);
                setManualToken('');
              }}
              disabled={submitting}
              style={{
                background: 'none',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: 13,
                color: submitting ? '#cbd5e1' : '#64748b',
                fontWeight: 600,
                padding: '8px 0',
                transition: 'color 0.2s',
              }}
            >
              ← Kembali ke Scanner
            </button>
          </>
        )}

        {/* Info Card */}
        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
          <p style={{ margin: 0, fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
            Posisikan QR Code di tengah bingkai untuk scan. Pastikan lokasi GPS Anda aktif untuk verifikasi kehadiran.
          </p>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        #qr-reader {
          width: 100%;
          height: 100%;
        }

        #qr-reader video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        #qr-reader canvas {
          display: none;
        }

        @keyframes scanline {
          0%   { top: 44px;   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: calc(100% - 44px); opacity: 0; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
