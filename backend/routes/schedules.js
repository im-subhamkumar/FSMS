import express from 'express';
import { PrismaClient } from '@prisma/client';
import { parseMetar, computeGoNoGo } from './weather.js';

const router = express.Router();
const prisma = new PrismaClient();

const AWC_BASE = 'https://aviationweather.gov/api/data';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function checkWeatherForSchedule(schedule) {
    console.log(`--- [SAFETY CHECK] Slot ID: ${schedule.id} ---`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
        const icao = 'VOBG';
        const url = `${AWC_BASE}/metar?ids=${icao}&format=json&hours=2`;
        console.log(`Fetching METAR from: ${url}`);
        
        const resp = await fetch(url, { signal: controller.signal });
        const data = await resp.json();
        clearTimeout(timeout);
        
        if (!data || data.length === 0) {
            console.warn(`[SAFETY] No METAR data found for ${icao}`);
            return schedule;
        }
        
        console.log(`[SAFETY] METAR received: ${data[0].rawOb}`);
        const metar = parseMetar(data[0].rawOb || '');
        const gonogo = computeGoNoGo(metar, 'pre_solo');
        
        console.log(`[SAFETY] Decision: ${gonogo.verdict}`);

        // Prediction for 2 days
        const lat = data[0].lat || 12.91;
        const lon = data[0].lon || 77.62;
        const atmosUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=windspeed_10m,precipitation,weathercode&forecast_days=2`;
        
        console.log(`Fetching 48h Outlook from: ${atmosUrl}`);
        const atmosResp = await fetch(atmosUrl);
        const atmosData = await atmosResp.json();
        
        let extremeWarning = null;
        if (atmosData.hourly) {
            const maxWind = Math.max(...atmosData.hourly.windspeed_10m);
            const maxPrecip = Math.max(...atmosData.hourly.precipitation);
            const hasHeavyRain = atmosData.hourly.weathercode.some(c => c >= 65 && c <= 99);
            
            if (maxWind > 40) {
                extremeWarning = `🚨 Cyclone/Severe Storm Warning: Predicted wind speeds up to ${maxWind.toFixed(1)} km/h within 48h!`;
            } else if (hasHeavyRain || maxPrecip > 10) {
                extremeWarning = `🌧️ Heavy Rainfall Warning: High precipitation predicted within 48h.`;
            }
        }

        const updateData = {
            weatherVerdict: gonogo.verdict,
            extremeWeatherWarning: extremeWarning
        };

        if (gonogo.verdict === 'NO-GO' || extremeWarning) {
            updateData.status = 'CANCELLED';
            updateData.cancellationReason = [
                ...(gonogo.reasons || []),
                extremeWarning
            ].filter(Boolean).join(' | ');
            console.log(`[SAFETY] AUTO-CANCELLING slot due to: ${updateData.cancellationReason}`);
        }

        const updated = await prisma.schedule.update({
            where: { id: schedule.id },
            data: updateData
        });
        console.log(`[SAFETY] DB update success for ID: ${schedule.id}`);
        return updated;
    } catch (err) {
        clearTimeout(timeout);
        console.error('[SAFETY] ERROR in safety check:', err.name === 'AbortError' ? 'Timeout reaching Weather API' : err);
        return schedule;
    }
}

// ── Routes ───────────────────────────────────────────────────────────────────

// Get all schedules
router.get('/', async (req, res) => {
    try {
        const schedules = await prisma.schedule.findMany({
            orderBy: { startTime: 'asc' }
        });
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a schedule
router.post('/', async (req, res) => {
    const { traineeId, traineeName, instructorId, instructorName, aircraftId, startTime, endTime } = req.body;
    
    if (!startTime || !endTime) {
        return res.status(400).json({ error: 'Starts and Ends times are required.' });
    }

    try {
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ error: 'Invalid date format provided.' });
        }

        const schedule = await prisma.schedule.create({
            data: {
                traineeId: parseInt(traineeId) || 1,
                traineeName: traineeName || 'John Trainee',
                instructorId: parseInt(instructorId) || 1,
                instructorName: instructorName || 'Alice Instructor',
                aircraftId: aircraftId || 'VT-ACC',
                startTime: start,
                endTime: end,
                status: 'SCHEDULED'
            }
        });
        
        console.log(`[SCHEDULE] Created slot ID ${schedule.id}. Starting weather check...`);
        // Immediate weather check upon scheduling
        const updated = await checkWeatherForSchedule(schedule);
        res.json(updated);
    } catch (err) {
        console.error('[SCHEDULE] Create failed:', err);
        res.status(500).json({ error: err.message });
    }
});

// Trigger weather check for all scheduled slots
router.post('/sync-weather', async (req, res) => {
    try {
        const activeSchedules = await prisma.schedule.findMany({
            where: { status: 'SCHEDULED' }
        });
        
        const results = [];
        for (const s of activeSchedules) {
            const updated = await checkWeatherForSchedule(s);
            results.push(updated);
        }
        
        res.json({ message: 'Sync complete', updatedCount: results.length, data: results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a schedule
router.delete('/:id', async (req, res) => {
    try {
        await prisma.schedule.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
