import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet/dist/leaflet.css';

export default function RadarMap({ lat, lon, stationId }) {
  const [frames, setFrames] = useState([]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [animating, setAnimating] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(() => Date.now());


  // Set mapReady after initial mount to avoid server/client mismatch
  // And update mapKey on unmount to appease React 18 Strict Mode
  useEffect(() => {
    setMapReady(true);
    return () => {
      setMapReady(false);
      setMapKey(Date.now());
    };
  }, []);

  useEffect(() => {
    // Load RainViewer data
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        const radar = data.radar;
        const past = radar.past || [];
        const nowcast = radar.nowcast || [];
        const radarList = [...past.slice(-5), ...nowcast.slice(0, 2)];
        setFrames(radarList);
        if (radarList.length > 0) {
          setCurrentFrameIdx(radarList.length - 1);
        }
      })
      .catch(err => console.warn('RainViewer load error:', err));
  }, []);

  useEffect(() => {
    let interval;
    if (animating && frames.length > 1) {
      interval = setInterval(() => {
        setCurrentFrameIdx(prev => (prev + 1) % frames.length);
      }, 700);
    }
    return () => clearInterval(interval);
  }, [animating, frames]);


  const currentFrame = frames[currentFrameIdx];
  const host = 'https://tilecache.rainviewer.com';
  const size = 256;
  const colorScheme = 6;
  const smooth = 1;
  const snow = 1;
  const radarUrl = currentFrame ? `${host}${currentFrame.path}/${size}/{z}/{x}/{y}/${colorScheme}/${smooth}_${snow}.png` : null;

  return (
    <div className="flex flex-col h-[500px] lg:h-full bg-white/70 dark:bg-slate-800/60 backdrop-blur-xl border border-blue-500/20 dark:border-slate-700/50 p-5 lg:mb-0 mb-4 rounded-2xl shadow-lg relative z-10 w-full lg:min-h-[600px]">
      <div className="flex justify-between items-center pb-3 mb-4 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-xl">🛰️</span>
          <span className="font-bold text-slate-800 dark:text-white">NEXRAD Radar</span>
        </div>
        <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
          <span className="flex items-center gap-1 sm:gap-2">
            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-go-green mr-1.5 shadow-sm"></span>0–20</span>
            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-caution-yellow mr-1.5 shadow-sm"></span>21–35</span>
            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-nogo-red mr-1.5 shadow-sm"></span>&gt;40 dBZ</span>
          </span>
        </div>
      </div>
      <div id="radarMap" className="flex-1 w-full min-h-[300px] lg:min-h-[480px] rounded-[10px] overflow-hidden relative shadow-inner border border-slate-200/50 dark:border-slate-700">
        {mapReady && lat && lon ? (
          <MapContainer
            key={`${mapKey}-${stationId}-${lat}-${lon}`}
            center={[lat, lon]}
            zoom={9}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
            scrollWheelZoom={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
            />
            {radarUrl && (
              <TileLayer
                url={radarUrl}
                opacity={0.7}
                zIndex={5}
                maxNativeZoom={6}
              />
            )}
            <CircleMarker
              center={[lat, lon]}
              radius={8}
              pathOptions={{ fillColor: '#3a7fff', color: '#fff', weight: 2, fillOpacity: 0.95 }}
            >
              <Popup><b>{stationId}</b><br />{lat.toFixed(4)}, {lon.toFixed(4)}</Popup>
            </CircleMarker>
          </MapContainer>
        ) : (
          <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.05)', color: '#94a3b8', fontSize: '0.85rem' }}>
            {lat && lon ? 'Loading radar...' : 'Enter an ICAO to load radar map'}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
        <span className="font-mono px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600">— dBZ</span>
        <span className="font-medium">{stationId ? `Radar centered on ${stationId}` : 'Load an airport to center radar'}</span>
      </div>
    </div>
  );
}
