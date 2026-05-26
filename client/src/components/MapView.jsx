import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Tooltip, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';

const TYPE_COLORS = {
  battle: '#c04040',
  event: '#7a9a4a',
  person: '#4a8aad',
};

function groupByLocation(events) {
  const groups = new Map();
  events.forEach(event => {
    const key = `${event.lat},${event.lng}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  });
  return groups;
}

function createStackIcon(count, isActive) {
  return L.divIcon({
    className: '',
    html: `<div class="stack-marker${isActive ? ' stack-marker--active' : ''}"><span class="stack-marker-count">${count}</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    tooltipAnchor: [0, -16],
  });
}

function MapController({ activeEvent }) {
  const map = useMap();

  useEffect(() => {
    if (!activeEvent) return;

    if (activeEvent.waypoints && activeEvent.waypoints.length > 1) {
      const bounds = activeEvent.waypoints.map(w => [w.lat, w.lng]);
      bounds.push([activeEvent.lat, activeEvent.lng]);
      map.fitBounds(bounds, { padding: [60, 60], animate: true, duration: 1 });
    } else {
      map.flyTo([activeEvent.lat, activeEvent.lng], 7, { animate: true, duration: 1 });
    }
  }, [activeEvent, map]);

  return null;
}

function RouteAnimation({ event }) {
  if (!event?.waypoints?.length) return null;

  const points = [
    ...event.waypoints.map(w => [w.lat, w.lng]),
    [event.lat, event.lng],
  ];

  return (
    <Polyline
      positions={points}
      pathOptions={{
        color: '#c9a84c',
        weight: 3,
        opacity: 0.9,
        dashArray: '8 5',
      }}
    />
  );
}

export default function MapView({ events, activeEventId, onEventSelect, onStackSelect, activeEvent, activeStack, persons = [], activePersonId, onPersonSelect }) {
  const allMarkers = [
    ...events.map(e => ({ ...e, _kind: 'event' })),
    ...persons.map(p => ({ ...p, _kind: 'person' })),
  ];
  const locationGroups = groupByLocation(allMarkers);
  const activeStackKey = activeStack ? `${activeStack[0].lat},${activeStack[0].lng}` : null;

  return (
    <div className="map-wrapper">
      <MapContainer
        center={[62, 17]}
        zoom={5}
        className="map-container"
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        <MapController activeEvent={activeEvent} />

        {activeEvent?.waypoints?.length > 0 && (
          <RouteAnimation event={activeEvent} />
        )}

        {[...locationGroups.entries()].map(([key, items]) => {
          const [lat, lng] = key.split(',').map(Number);

          if (items.length === 1) {
            const item = items[0];
            if (item._kind === 'person') {
              const isActive = activePersonId === item.id;
              return (
                <CircleMarker
                  key={`person-${item.id}`}
                  center={[lat, lng]}
                  radius={isActive ? 11 : 8}
                  pathOptions={{
                    color: isActive ? '#e8dfc8' : 'rgba(255,255,255,0.55)',
                    fillColor: '#4a8aad',
                    fillOpacity: isActive ? 1 : 0.85,
                    weight: isActive ? 2 : 1.5,
                  }}
                  eventHandlers={{ click: () => onPersonSelect(item.id) }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                    <span style={{ fontFamily: 'EB Garamond, serif', fontSize: '13px' }}>
                      {item.name} · {item.born}–{item.died}
                    </span>
                  </Tooltip>
                </CircleMarker>
              );
            }

            const isActive = activeEventId === item.id;
            return (
              <CircleMarker
                key={item.id}
                center={[lat, lng]}
                radius={isActive ? 10 : 7}
                pathOptions={{
                  color: isActive ? '#e8dfc8' : 'rgba(255,255,255,0.55)',
                  fillColor: TYPE_COLORS[item.type] || '#c9a84c',
                  fillOpacity: isActive ? 1 : 0.85,
                  weight: isActive ? 2 : 1.5,
                }}
                eventHandlers={{ click: () => onEventSelect(item.id) }}
              >
                <Tooltip direction="top" offset={[0, -8]} opacity={0.9}>
                  <span style={{ fontFamily: 'EB Garamond, serif', fontSize: '13px' }}>
                    {item.name} · {item.year}
                  </span>
                </Tooltip>
              </CircleMarker>
            );
          }

          const isActive = activeStackKey === key;
          const label = items.find(i => i.modern_location)?.modern_location || items[0].name;
          return (
            <Marker
              key={key}
              position={[lat, lng]}
              icon={createStackIcon(items.length, isActive)}
              eventHandlers={{ click: () => onStackSelect(items) }}
            >
              <Tooltip direction="top" offset={[0, -16]} opacity={0.9}>
                <span style={{ fontFamily: 'EB Garamond, serif', fontSize: '13px' }}>
                  {label} · {items.length} händelser
                </span>
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
