import { useState, useEffect, useRef, useCallback } from 'react';
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
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' | 'user'

  const scannerInstanceRef = useRef(null);
  const qrReaderRef = useRef(null);
  const processingRef = useRef(false);

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

  const stopScanner = useCallback(async () => {
    if (scannerInstanceRef.current) {
      try {
        const state = scannerInstanceRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerInstanceRef.current.stop();
        }
      } catch (e) {}
      scannerInstanceRef.current = null;
    }
    setScannerReady(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (!qrReaderRef.current) return;

    try {
      // Cleanup div
      const container = document.getElementById('qr-reader');
      if (container) container.innerHTML = '';

      const scanner = new Html5Qrcode('qr-reader');
      scannerInstanceRef.current = scanner;

      const containerWidth = qrReaderRef.current?.offsetWidth || 400;
      const qrBoxSize = Math.min(Math.floor(containerWidth * 0.75), 320);

      await scanner.start(
        { facingMode: cameraFacing },
        {
          fps: 10,
          qrbox: { width: qrBoxSize, height: qrBoxSize },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: false,
          disableFlip: false, // let html5qrcode handle orientation
        },
        (decodedText) => handleQRSuccess(decodedText),
        () => {} // suppress scan errors
      );

      setScannerReady(true);
      setCameraError(null);
    } catch (err) {
      let errorMsg = 'Gagal membuka kamera. Pastikan izin kamera sudah diaktifkan.';

      if (err.name === 'NotAllowedError' || (err.message && err.message.includes('Permission'))) {
        errorMsg = '📷 Izin akses kamera ditolak. Aktifkan izin kamera di pengaturan perangkat Anda.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = '📷 Tidak ada perangkat kamera ditemukan pada perangkat ini.';
      } else if (err.name === 'NotSupportedError') {
        errorMsg = '📷 Browser Anda tidak mendukung akses kamera.';
      }

      setCameraError(errorMsg);
      setScannerReady(false);
    }
  }, [cameraFacing]);

  useEffect(() => {
    if (mode !== 'scanner') {
      stopScanner();
      return;
    }

    startScanner();

    return () => {
      stopScanner();
    };
  }, [mode, cameraFacing]);

  const handleQRSuccess = async (decodedText) => {
    if (processingRef.current) return;
    processingRef.current = true;
    await stopScanner();
    await submitQRToken(decodedText);
    processingRef.current = false;
  };

  const toggleCamera = async () => {
    await stopScanner();
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const submitQRToken = async (token) => {
    if (!token || !token.trim()) {
      setResult({
        success: false,
        message: 'Token QR tidak boleh kosong.',
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
        // Restart scanner after error
        if (mode === 'scanner') {
          setTimeout(() => startScanner(), 500);
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
        message: 'Absensi berhasil dicatat! Selamat mengajar!',
      });

      setTimeout(() => navigate('/dosen/riwayat'), 2500);
    } catch (err) {
      const backendErr = err.response?.data;
      const errorCode = backendErr?.kode_error;
      const errorMessage = backendErr?.pesan || backendErr?.message;

      setResult({
        success: false,
        message: mapErrorMessage(errorCode, errorMessage),
      });

      // Restart scanner after error
      if (mode === 'scanner') {
        setTimeout(() => startScanner(), 1000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    submitQRToken(manualToken);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px 12px',
          background: 'linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0) 100%)',
          position: 'relative',
          zIndex: 20,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px' }}>
          Scan QR Absensi
        </h2>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
          Arahkan kamera ke QR Code yang ditampilkan admin
        </p>
      </div>

      {/* Scanner Area */}
      <div
        style={{
          flex: '0 0 auto',
          background: '#0f172a',
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Camera viewport - aspect ratio square */}
        <div
          style={{
            width: '100%',
            maxWidth: 480,
            aspectRatio: '1 / 1',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {cameraError ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                padding: 24,
                background: '#0f172a',
              }}
            >
              <div style={{ fontSize: 52 }}>📷</div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f87171', textAlign: 'center', maxWidth: 280 }}>
                {cameraError}
              </p>
              <button
                onClick={() => {
                  setCameraError(null);
                  setScannerReady(false);
                  setMode('scanner');
                  setTimeout(() => startScanner(), 200);
                }}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#fff',
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
          ) : (
            <>
              {/* QR Reader Container */}
              <div
                ref={qrReaderRef}
                id="qr-reader"
                className={cameraFacing === 'user' ? 'camera-front' : ''}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                }}
              />

              {/* Overlay frame - scanner corners */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  zIndex: 11,
                }}
              >
                {/* Corner decorations */}
                {['tl', 'tr', 'bl', 'br'].map((corner) => (
                  <div
                    key={corner}
                    style={{
                      position: 'absolute',
                      width: 36,
                      height: 36,
                      borderColor: '#22c55e',
                      borderStyle: 'solid',
                      borderWidth: 0,
                      ...(corner === 'tl'
                        ? { top: '12.5%', left: '12.5%', borderTopWidth: 4, borderLeftWidth: 4, borderRadius: '6px 0 0 0' }
                        : corner === 'tr'
                        ? { top: '12.5%', right: '12.5%', borderTopWidth: 4, borderRightWidth: 4, borderRadius: '0 6px 0 0' }
                        : corner === 'bl'
                        ? { bottom: '12.5%', left: '12.5%', borderBottomWidth: 4, borderLeftWidth: 4, borderRadius: '0 0 0 6px' }
                        : { bottom: '12.5%', right: '12.5%', borderBottomWidth: 4, borderRightWidth: 4, borderRadius: '0 0 6px 0' }),
                    }}
                  />
                ))}

                {/* Scan line animation */}
                {scannerReady && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '12.5%',
                      right: '12.5%',
                      height: 2,
                      background: 'linear-gradient(90deg, transparent, #22c55e, transparent)',
                      animation: 'scanline 2.4s ease-in-out infinite',
                      top: '50%',
                    }}
                  />
                )}
              </div>

              {/* Camera switch button - top right */}
              {mode === 'scanner' && (
                <button
                  onClick={toggleCamera}
                  disabled={submitting}
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    zIndex: 20,
                    background: 'rgba(15,23,42,0.65)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    borderRadius: 12,
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                    opacity: submitting ? 0.5 : 1,
                  }}
                >
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {cameraFacing === 'environment' ? 'Depan' : 'Belakang'}
                </button>
              )}

              {/* Scanner status badge - bottom */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: scannerReady ? 'rgba(34,197,94,0.85)' : 'rgba(100,116,139,0.85)',
                  backdropFilter: 'blur(6px)',
                  color: '#fff',
                  fontSize: 12,
                  padding: '6px 14px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  zIndex: 20,
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
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                    Inisialisasi...
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Controls & Info */}
      <div style={{ flex: 1, background: '#fff', borderRadius: '24px 24px 0 0', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14, marginTop: -24, position: 'relative', zIndex: 10 }}>
        {/* Result */}
        {result && (
          <div
            style={{
              background: result.success ? '#f0fdf4' : '#fef2f2',
              border: `1.5px solid ${result.success ? '#86efac' : '#fca5a5'}`,
              borderRadius: 16,
              padding: '16px 18px',
              textAlign: 'center',
              animation: 'slideDown 0.3s ease-out',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>
              {result.success ? '✅' : '❌'}
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: result.success ? '#15803d' : '#dc2626',
                lineHeight: 1.5,
              }}
            >
              {result.message}
            </p>
          </div>
        )}

        {/* Mode controls */}
        {mode === 'scanner' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>ATAU</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            <button
              onClick={() => { setResult(null); setMode('manual'); }}
              disabled={submitting}
              style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: 14,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                color: submitting ? '#cbd5e1' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '13px 16px',
                transition: 'all 0.2s',
              }}
            >
              Masukkan Kode Manual
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
                autoFocus
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
              }}
            >
              {submitting ? 'Memproses…' : 'Konfirmasi Absensi'}
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
                textAlign: 'center',
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
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>💡</span>
          <p style={{ margin: 0, fontSize: 12, color: '#92400e', lineHeight: 1.6 }}>
            Posisikan QR Code di tengah bingkai hijau. Pastikan pencahayaan cukup dan lokasi GPS aktif untuk verifikasi kehadiran.
          </p>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        /* Hide html5-qrcode default UI elements */
        #qr-reader {
          border: none !important;
          width: 100% !important;
          height: 100% !important;
        }

        #qr-reader__header_message,
        #qr-reader__status_span,
        #qr-reader__camera_permission_button,
        #qr-reader__dashboard_section_csr,
        #qr-reader__dashboard_section_swaplink,
        #qr-reader select,
        #qr-reader__filescan_input,
        #qr-reader__torch_button,
        #qr-reader__dashboard_section {
          display: none !important;
        }

        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          transform: scaleX(1) !important;
        }

        #qr-reader.camera-front video {
          transform: scaleX(-1) !important;
        }

        #qr-reader canvas {
          display: none !important;
        }

        @keyframes scanline {
          0%   { transform: translateY(-150px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(150px); opacity: 0; }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
