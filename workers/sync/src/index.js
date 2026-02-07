/**
 * Cloudflare Worker for BarcaLive Data Sync
 * Syncs data from external API to Supabase cache.
 * Triggers: Cron (Every minute) + Manual HTTP trigger
 */

import { createClient } from '@supabase/supabase-js';

export default {
    async fetch(request, env, ctx) {
        // Manual trigger for debugging or immediate update
        const url = new URL(request.url);
        if (url.pathname === '/trigger') {
            await syncData(env);
            return new Response('Sync triggered successfully', { status: 200 });
        }
        return new Response('BarcaLive Sync Worker', { status: 200 });
    },

    async scheduled(event, env, ctx) {
        ctx.waitUntil(handleSchedule(env));
    }
};

/**
 * Main Scheduling Handler
 * Implements "Match Mode": Run once, check if live, if so wait 30s and run again.
 */
async function handleSchedule(env) {
    console.log('[Worker] Starting scheduled sync...');

    // 1. First Run
    const data = await syncData(env);

    // 2. Check for Live Match (Match Mode)
    if (data && hasLiveMatch(data)) {
        console.log('[Worker] Live match detected! Waiting 30s for second sync...');
        await new Promise(resolve => setTimeout(resolve, 30000));

        console.log('[Worker] Running second sync (Match Mode)...');
        await syncData(env);
    }

    console.log('[Worker] Scheduled sync completed.');
}

/**
 * Core Sync Function
 */
async function syncData(env) {
    const API_URL = 'https://natekkz-n8nhost.hf.space/webhook/api';

    try {
        // 1. Fetch from External API
        console.log(`[Worker] Fetching from ${API_URL}...`);
        const response = await fetch(API_URL);

        if (!response.ok) {
            console.error(`[Worker] API Error: ${response.status}`);
            return null;
        }

        const rawData = await response.json();

        // 2. Validate Data (Fail-safe)
        if (!isValidData(rawData)) {
            console.error('[Worker] Invalid data received, aborting sync.');
            return null;
        }

        const data = Array.isArray(rawData) ? rawData[0] : rawData;

        // 3. Init Supabase
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

        // 4. Update app_cache (JSONB)
        const { error: cacheError } = await supabase
            .from('app_cache')
            .upsert({
                id: '1',
                data: data,
                last_updated: new Date().toISOString()
            });

        if (cacheError) {
            console.error('[Worker] Supabase app_cache error:', cacheError);
        } else {
            console.log('[Worker] app_cache updated.');
        }

        // 5. Update granular tables (Standings/Matches) - Optional but good for backup
        // We do this in background to not block the main flow too long? 
        // Actually, for "Match Mode" speed, we might prioritize app_cache.
        // Let's do it sequentially for safety.

        // TODO: Granular updates if needed.
        // For now, app_cache is the source of truth for the frontend as per plan.

        return data;

    } catch (err) {
        console.error('[Worker] Sync failed:', err);
        return null;
    }
}

/**
 * Helpers
 */
function isValidData(data) {
    // Basic check: must have matches and standings
    if (!data) return false;
    const d = Array.isArray(data) ? data[0] : data;
    return d && d.matches && d.standings;
}

function hasLiveMatch(data) {
    if (!data || !data.matches || !data.matches.live) return false;
    return data.matches.live.length > 0;
}
