// ============================================================
// components/common/MapPickerModal.jsx
// Modal peta interaktif untuk memilih lokasi (lat/lng).
// - Klik di peta → set koordinat
// - Drag marker → update koordinat
// - Tombol "Lokasi Saya" → gunakan GPS browser
// - Search nama tempat via Nominatim (OpenStreetMap)
// ============================================================

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { X, Crosshair, Search, CheckCircle, MapPin } from 'lucide-react'

// Fix default marker icon missing in Vite/Webpack bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom blue marker
const blueIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Sub-component: listens for map clicks
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    }
  })
  return null
}

// Sub-component: fly to position
function MapFlyTo({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) {
      map.flyTo(position, 17, { duration: 1.2 })
    }
  }, [position, map])
  return null
}

export default function MapPickerModal({ 
  initialLat, 
  initialLng, 
  radius = 100,
  onConfirm,   // (lat, lng) => void
  onClose 
}) {
  const defaultLat = initialLat && initialLat !== 0 ? initialLat : 1.4174  // Manado area default
  const defaultLng = initialLng && initialLng !== 0 ? initialLng : 124.9840

  const [position, setPosition] = useState({ lat: defaultLat, lng: defaultLng })
  const [flyTo, setFlyTo] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')
  const searchTimeoutRef = useRef(null)

  const handleLocationSelect = useCallback((lat, lng) => {
    setPosition({ lat, lng })
  }, [])

  // Search via Nominatim (OpenStreetMap)
  const handleSearch = async (query) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=id`,
        { headers: { 'Accept-Language': 'id' } }
      )
      const data = await res.json()
      setSearchResults(data)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleSearchInput = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => handleSearch(val), 600)
  }

  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setPosition({ lat, lng })
    setFlyTo([lat, lng])
    setSearchResults([])
    setSearchQuery(result.display_name.split(',').slice(0, 2).join(','))
  }

  // Use browser GPS
  const handleUseMyLocation = () => {
    setGpsError('')
    if (!navigator.geolocation) {
      setGpsError('Browser tidak mendukung GPS.')
      return
    }
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setPosition({ lat, lng })
        setFlyTo([lat, lng])
        setGpsLoading(false)
      },
      (err) => {
        setGpsError('Tidak dapat mengakses GPS. Pastikan izin lokasi diaktifkan.')
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleConfirm = () => {
    onConfirm(position.lat, position.lng)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden" style={{ maxHeight: '95vh' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0">
          <div className="flex items-center gap-2">
            <MapPin size={20} />
            <h3 className="text-lg font-bold">Pilih Lokasi di Peta</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pt-3 pb-2 shrink-0 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder="Cari nama gedung, jalan, atau lokasi..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white shadow-sm"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-[10000] left-4 right-4 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm border-b border-gray-50 last:border-0 transition-colors"
                >
                  <div className="font-medium text-gray-800 truncate">
                    {result.display_name.split(',').slice(0, 2).join(',')}
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">
                    {result.display_name}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="relative flex-1" style={{ minHeight: '350px' }}>
          <MapContainer
            center={[defaultLat, defaultLng]}
            zoom={16}
            style={{ width: '100%', height: '100%', minHeight: '350px' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            {flyTo && <MapFlyTo position={flyTo} />}
            <Marker
              position={[position.lat, position.lng]}
              icon={blueIcon}
              draggable={true}
              eventHandlers={{
                dragend(e) {
                  const latlng = e.target.getLatLng()
                  setPosition({ lat: latlng.lat, lng: latlng.lng })
                }
              }}
            />
            <Circle
              center={[position.lat, position.lng]}
              radius={radius}
              pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2 }}
            />
          </MapContainer>

          {/* Hint overlay */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm whitespace-nowrap pointer-events-none">
            Klik di peta atau drag marker untuk set lokasi
          </div>
        </div>

        {/* Bottom panel */}
        <div className="shrink-0 border-t border-gray-100 bg-gray-50 px-4 py-3">
          {/* Coordinates display */}
          <div className="flex flex-wrap gap-3 mb-3">
            <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-500 mb-0.5">Latitude</div>
              <div className="font-mono text-sm font-semibold text-gray-800 truncate">{position.lat.toFixed(7)}</div>
            </div>
            <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <div className="text-xs text-gray-500 mb-0.5">Longitude</div>
              <div className="font-mono text-sm font-semibold text-gray-800 truncate">{position.lng.toFixed(7)}</div>
            </div>
          </div>

          {gpsError && (
            <p className="text-xs text-red-500 mb-2">{gpsError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleUseMyLocation}
              disabled={gpsLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-60"
            >
              {gpsLoading ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Crosshair size={16} />
              )}
              {gpsLoading ? 'Mendeteksi...' : 'Lokasi Saya'}
            </button>

            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
            >
              Batal
            </button>

            <button
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              <CheckCircle size={16} />
              Gunakan Lokasi Ini
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
