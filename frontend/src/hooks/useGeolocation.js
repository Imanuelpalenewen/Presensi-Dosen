import { useState, useCallback, useRef } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef(null);

  const getLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = 'Geolocation tidak didukung oleh browser ini.';
        setError(msg);
        reject(new Error(msg));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setLocation(coords);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          let message = 'Gagal mendapatkan lokasi.';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              message =
                'Izin akses lokasi ditolak. Harap aktifkan akses lokasi di pengaturan browser Anda.';
              break;
            case err.POSITION_UNAVAILABLE:
              message =
                'Informasi lokasi tidak tersedia. Pastikan GPS aktif.';
              break;
            case err.TIMEOUT:
              message =
                'Waktu pengambilan lokasi habis. Coba lagi di area dengan sinyal GPS lebih baik.';
              break;
            default:
              message = `Error lokasi: ${err.message}`;
          }
          setError(message);
          setLoading(false);
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  const watchLocation = useCallback((onUpdate) => {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setLocation(coords);
        if (onUpdate) onUpdate(coords);
      },
      null,
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }, []);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  return { location, error, loading, getLocation, watchLocation, clearWatch };
};