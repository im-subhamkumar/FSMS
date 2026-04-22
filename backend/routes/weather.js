import express from 'express';

const router = express.Router();

// ── Configuration ──────────────────────────────────────────────────────────────
const AWC_BASE = 'https://aviationweather.gov/api/data';

const THRESHOLDS = {
    'pre_solo':      { wind: 10, gust: 5,  crosswind: 5 },
    'post_solo':     { wind: 15, gust: 10, crosswind: 8 },
    'cross_country': { wind: 20, gust: 10, crosswind: 12 },
    'dual_cfi':      { wind: 25, gust: 15, crosswind: null }, 
};

const STUDENT_LABELS = {
    'pre_solo':      'Pre-Solo',
    'post_solo':     'Post-Solo',
    'cross_country': 'Cross-Country',
    'dual_cfi':      'Dual (with CFI)',
};

const HAZARD_CODES = {
    'TS': 'Thunderstorm',
    'GR': 'Hail',
    'FZ': 'Freezing Rain / Icing',
    'SQ': 'Squall',
    'FC': 'Funnel Cloud / Tornado',
};

// ── METAR Parser ────────────────────────────────────────────────────────────────
export function parseMetar(raw) {
    const result = {
        raw: raw,
        wind_dir: null,
        wind_speed: null,
        wind_gust: null,
        wind_unit: 'KT',
        visibility_sm: null,
        ceiling_ft: null,
        temperature_c: null,
        dewpoint_c: null,
        altimeter_inhg: null,
        sky_conditions: [],
        hazards: [],
        flight_category: 'UNKNOWN',
    };

    // Wind: 27015G25KT or 00000KT or VRB05KT
    const windMatch = raw.match(/(VRB|\d{3})(\d{2,3})(G(\d{2,3}))?(KT|MPS)/);
    if (windMatch) {
        result.wind_dir = windMatch[1];
        result.wind_speed = parseInt(windMatch[2]);
        result.wind_gust = windMatch[4] ? parseInt(windMatch[4]) : null;
        result.wind_unit = windMatch[5];
    }

    // Visibility in SM: e.g. 10SM, 1/2SM, 1 1/2SM
    const visMatch = raw.match(/(?:^|\s)(\d+(?:\s+\d+\/\d+)?|\d+\/\d+)SM/);
    if (visMatch) {
        const visStr = visMatch[1].trim();
        try {
            if (visStr.includes(' ')) {
                const parts = visStr.split(/\s+/);
                const fraction = parts[1].split('/');
                result.visibility_sm = parseInt(parts[0]) + (parseInt(fraction[0]) / parseInt(fraction[1]));
            } else if (visStr.includes('/')) {
                const fraction = visStr.split('/');
                result.visibility_sm = parseInt(fraction[0]) / parseInt(fraction[1]);
            } else {
                result.visibility_sm = parseFloat(visStr);
            }
        } catch (e) {
            result.visibility_sm = null;
        }
    }

    // Sky conditions: FEW/SCT/BKN/OVC + height
    const skyMatches = Array.from(raw.matchAll(/(FEW|SCT|BKN|OVC)(\d{3})/g));
    result.sky_conditions = skyMatches.map(m => ({
        cover: m[1],
        height_ft: parseInt(m[2]) * 100
    }));

    // Ceiling = lowest BKN or OVC
    const ceilingLayers = result.sky_conditions.filter(s => ['BKN', 'OVC'].includes(s.cover));
    if (ceilingLayers.length > 0) {
        result.ceiling_ft = Math.min(...ceilingLayers.map(s => s.height_ft));
    }

    // Temperature / Dewpoint: 15/08 or M02/M05
    const tempMatch = raw.match(/\b(M?\d{2})\/(M?\d{2})\b/);
    if (tempMatch) {
        const parseTemp = (t) => t.startsWith('M') ? -parseInt(t.substring(1)) : parseInt(t);
        result.temperature_c = parseTemp(tempMatch[1]);
        result.dewpoint_c = parseTemp(tempMatch[2]);
    }

    // Altimeter: A2992
    const altMatch = raw.match(/A(\d{4})/);
    if (altMatch) {
        result.altimeter_inhg = parseInt(altMatch[1]) / 100;
    }

    // Hazards
    for (const [code, label] of Object.entries(HAZARD_CODES)) {
        if (new RegExp(`\\b${code}\\b`).test(raw)) {
            result.hazards.push({ code, label });
        }
    }

    // Flight category calculation
    const vis = result.visibility_sm;
    const ceil = result.ceiling_ft;
    
    if (vis !== null && ceil !== null) {
        if (vis >= 5 && ceil >= 3000) result.flight_category = 'VFR';
        else if (vis >= 3 && ceil >= 1000) result.flight_category = 'MVFR';
        else if (vis >= 1 && ceil >= 500) result.flight_category = 'IFR';
        else result.flight_category = 'LIFR';
    } else if (vis !== null) {
        result.flight_category = vis >= 5 ? 'VFR' : (vis >= 3 ? 'MVFR' : 'IFR');
    } else if (ceil !== null) {
        result.flight_category = ceil >= 3000 ? 'VFR' : (ceil >= 1000 ? 'MVFR' : 'IFR');
    }

    return result;
}

// ── Go/No-Go Engine ─────────────────────────────────────────────────────────────
export function computeGoNoGo(metarData, studentType) {
    let verdict = 'GO';
    const reasons = [];
    const warnings = [];
    const thresh = THRESHOLDS[studentType] || THRESHOLDS['pre_solo'];

    const windSpeed = metarData.wind_speed || 0;
    const windGust = metarData.wind_gust || 0;
    const visibility = metarData.visibility_sm;
    const ceiling = metarData.ceiling_ft;
    const hazards = metarData.hazards || [];

    // Auto-cancel for hazard codes
    hazards.forEach(h => {
        verdict = 'NO-GO';
        reasons.push(`⛔ Hazardous condition detected: ${h.label} (${h.code}) — Automatic cancellation`);
    });

    // Wind speed check
    if (windSpeed > thresh.wind) {
        verdict = 'NO-GO';
        reasons.push(`💨 Wind speed ${windSpeed} KT exceeds ${STUDENT_LABELS[studentType]} limit of ${thresh.wind} KT`);
    }

    // Gust check
    if (windGust && windGust > thresh.gust) {
        verdict = 'NO-GO';
        reasons.push(`💨 Wind gust ${windGust} KT exceeds ${STUDENT_LABELS[studentType]} gust limit of ${thresh.gust} KT`);
    }

    // Visibility check
    if (visibility !== null && visibility < 3) {
        verdict = 'NO-GO';
        reasons.push(`🌫️ Visibility ${visibility} SM is below VFR minimum of 3 SM`);
    } else if (visibility !== null && visibility < 5) {
        warnings.push(`⚠️ Visibility ${visibility} SM — Marginal VFR conditions`);
    }

    // Ceiling check
    if (ceiling !== null && ceiling < 1000) {
        verdict = 'NO-GO';
        reasons.push(`☁️ Ceiling ${ceiling} ft AGL is below minimum of 1,000 ft AGL`);
    } else if (ceiling !== null && ceiling < 3000) {
        warnings.push(`⚠️ Ceiling ${ceiling} ft — Marginal VFR conditions`);
    }

    if (verdict === 'GO' && warnings.length === 0) {
        reasons.push(`✅ All weather parameters within safe limits for ${STUDENT_LABELS[studentType]}`);
    }

    return {
        verdict,
        student_type: studentType,
        student_label: STUDENT_LABELS[studentType],
        reasons,
        warnings,
        thresholds: thresh,
    };
}

// ── Endpoints ────────────────────────────────────────────────────────────────

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', module: 'weather', timestamp: new Date().toISOString() });
});

// METAR
router.get('/metar/:icao', async (req, res) => {
    const icao = req.params.icao.toUpperCase().trim();
    try {
        const resp = await fetch(`${AWC_BASE}/metar?ids=${icao}&format=json&hours=2`);
        const data = await resp.json();
        if (!data || data.length === 0) {
            return res.status(404).json({ error: `No METAR data found for ${icao}` });
        }
        const entry = data[0];
        const parsed = parseMetar(entry.rawOb || '');
        
        parsed.station_id = entry.icaoId || icao;
        parsed.name = entry.name || icao;
        parsed.obs_time = entry.reportTime;
        parsed.lat = entry.lat;
        parsed.lon = entry.lon;
        
        res.json(parsed);
    } catch (e) {
        res.status(502).json({ error: e.message });
    }
});

// TAF
router.get('/taf/:icao', async (req, res) => {
    const icao = req.params.icao.toUpperCase().trim();
    try {
        const resp = await fetch(`${AWC_BASE}/taf?ids=${icao}&format=json&hours=6`);
        const data = await resp.json();
        res.json(data);
    } catch (e) {
        res.status(502).json({ error: e.message });
    }
});

// Open-Meteo Proxy
router.get('/openmeteo', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });
    try {
        const resp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,precipitation,weathercode&forecast_days=2`);
        const data = await resp.json();
        res.json(data);
    } catch (e) {
        res.status(502).json({ error: e.message });
    }
});

// Go/No-Go Decision (POST)
router.post('/gonogo', async (req, res) => {
    const { icao, student_type } = req.body;
    try {
        const resp = await fetch(`${AWC_BASE}/metar?ids=${icao}&format=json&hours=2`);
        const data = await resp.json();
        if (!data || data.length === 0) return res.status(404).json({ error: 'No data' });
        
        const entry = data[0];
        const metar = parseMetar(entry.rawOb || '');
        const result = computeGoNoGo(metar, student_type || 'pre_solo');
        
        // Add extreme weather prediction check
        try {
            const atmosResp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${entry.lat}&longitude=${entry.lon}&hourly=windspeed_10m,precipitation,weathercode&forecast_days=2`);
            const atmosData = await atmosResp.json();
            
            if (atmosData.hourly) {
                const maxWind = Math.max(...atmosData.hourly.windspeed_10m);
                const maxPrecip = Math.max(...atmosData.hourly.precipitation);
                const hasHeavyRain = atmosData.hourly.weathercode.some(c => c >= 65 && c <= 99);
                
                if (maxWind > 40) {
                    result.extreme_warning = `🚨 Cyclone Forecast: High winds (${maxWind.toFixed(1)} km/h) predicted within 48h!`;
                } else if (hasHeavyRain || maxPrecip > 10) {
                    result.extreme_warning = `🌧️ Heavy Rain Alert: Torrential rainfall predicted within 48h.`;
                }
            }
        } catch (e) {
            console.error('Extreme weather check failed', e);
        }
        
        res.json(result);
    } catch (e) {
        res.status(502).json({ error: e.message });
    }
});

// Unified Summary
router.get('/summary/:icao', async (req, res) => {
    // Already implemented, keeping it consistent
    const icao = req.params.icao.toUpperCase().trim();
    const studentType = req.query.student_type || 'pre_solo';
    try {
        const resp = await fetch(`${AWC_BASE}/metar?ids=${icao}&format=json&hours=2`);
        const data = await resp.json();
        if (!data || data.length === 0) {
            return res.status(404).json({ error: `No METAR found for ${icao}` });
        }
        const entry = data[0];
        const metar = parseMetar(entry.rawOb || '');
        const gonogo = computeGoNoGo(metar, studentType);
        
        res.json({
            icao,
            timestamp: new Date().toISOString(),
            metar,
            go_no_go: gonogo
        });
    } catch (e) {
        res.status(502).json({ error: e.message });
    }
});

export default router;
