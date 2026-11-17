import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix default Leaflet icon paths in React
delete L.Icon.Default.prototype._getIconUrl;

// Custom modern SVG icons
const createCustomIcon = (color, emoji) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 38px;
        height: 38px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        border: 2px solid white;
        font-size: 18px;
        cursor: pointer;
      ">
        ${emoji}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
};

const redEmergencyIcon = createCustomIcon('#dc2626', '🚨');
const greenVolunteerIcon = createCustomIcon('#16a34a', '🛡️');
const blueUserIcon = createCustomIcon('#2563eb', '📍');

// Helper to recenter map when center changes
function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, zoom || 14);
    }
  }, [center, zoom, map]);
  return null;
}

// Click listener to place pin
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      }
    },
  });
  return null;
}

export const EmergencyMap = ({
  center = [12.9716, 77.5946], // Default [lat, lng]
  zoom = 13,
  emergencyLocation = null, // { coordinates: [lng, lat], address, category }
  volunteerLocation = null, // { coordinates: [lng, lat], name, vehicleType }
  nearbyVolunteers = [], // array of volunteers
  onLocationSelect = null, // function(coords) for picking location
  height = '400px',
  interactive = true,
  routeLine = false,
}) => {
  // Convert [lng, lat] from GeoJSON to Leaflet [lat, lng]
  const centerLatLng = Array.isArray(center)
    ? center[0] > 50 // Likely lng first if > 50 for Indian coords
      ? [center[1], center[0]]
      : [center[0], center[1]]
    : [12.9716, 77.5946];

  let emergLatLng = null;
  if (emergencyLocation && emergencyLocation.coordinates) {
    emergLatLng = [emergencyLocation.coordinates[1], emergencyLocation.coordinates[0]];
  }

  let volLatLng = null;
  if (volunteerLocation && volunteerLocation.coordinates) {
    volLatLng = [volunteerLocation.coordinates[1], volunteerLocation.coordinates[0]];
  }

  return (
    <div style={{ height, width: '100%' }} className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      <MapContainer
        center={emergLatLng || centerLatLng}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap center={emergLatLng || volLatLng || centerLatLng} zoom={zoom} />
        {onLocationSelect && <MapClickHandler onLocationSelect={onLocationSelect} />}

        {/* Emergency Pin */}
        {emergLatLng && (
          <Marker position={emergLatLng} icon={redEmergencyIcon}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-red-600 text-sm">🚨 Emergency Incident</p>
                <p className="text-xs text-slate-700 font-medium">
                  {emergencyLocation.category || 'Incident Site'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {emergencyLocation.address || 'Reported Location'}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Assigned Volunteer Pin */}
        {volLatLng && (
          <Marker position={volLatLng} icon={greenVolunteerIcon}>
            <Popup>
              <div className="p-1">
                <p className="font-bold text-emerald-600 text-sm">🛡️ Assigned Helper</p>
                <p className="text-xs text-slate-700 font-medium">{volunteerLocation.name || 'Volunteer'}</p>
                <p className="text-xs text-slate-500">Vehicle: {volunteerLocation.vehicleType || 'Dispatched'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Line connecting Emergency & Helper */}
        {routeLine && emergLatLng && volLatLng && (
          <Polyline
            positions={[volLatLng, emergLatLng]}
            color="#2563eb"
            weight={4}
            dashArray="8, 8"
            opacity={0.8}
          />
        )}

        {/* Nearby Available Volunteers Pins */}
        {nearbyVolunteers &&
          nearbyVolunteers.map((vol, idx) => {
            const coords = vol.currentLocation?.coordinates;
            if (!coords) return null;
            const pos = [coords[1], coords[0]];
            return (
              <Marker key={vol._id || idx} position={pos} icon={greenVolunteerIcon}>
                <Popup>
                  <div className="p-1">
                    <p className="font-bold text-slate-800 text-sm">{vol.userId?.name || 'Available Helper'}</p>
                    <p className="text-xs text-emerald-600 font-medium">Available to assist</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Distance: {vol.distanceFormatted || 'Nearby'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {onLocationSelect && (
        <div className="absolute top-3 left-14 z-[400] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-300 shadow-md text-xs font-semibold text-slate-700 pointer-events-none">
          👆 Click anywhere on map to pin emergency location
        </div>
      )}
    </div>
  );
};

export default EmergencyMap;
