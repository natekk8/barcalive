import { CONFIG } from './config.js';
import { barcaState } from './state.js';
import { supabase } from './supabase-client.js';

/**
 * Core API Management System for BarcaLive
 * Handles fetching, in-memory caching, and rate-limiting.
 * Singleton pattern (Class-based).
 */
export class BarcaAPI {
  constructor() {
    if (BarcaAPI.instance) {
      return BarcaAPI.instance;
    }

    /** @private */
    this._cache = new Map();
    /** @private */
    this._lastFetch = new Map();
    /** @private */
    this._lastMatchStatus = null; // Track match status for end detection

    // Try to restore cache from sessionStorage for cross-page persistence (index -> overview)
    this._restoreCache();
    /** @private */
    this._rateLimitMs = 5000; // 5 seconds per endpoint

    BarcaAPI.instance = this;
  }

  /**
   * Fetches the consolidated data from the API
   * @returns {Promise<Object>}
   */
  /**
   * Fetches the consolidated data from Supabase app_cache
   * @returns {Promise<Object>}
   */
  async fetchAllData(silent = false) {
    // 1. Connectivity Check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      barcaState.setState('offline');
      return { success: false, data: null, timestamp: Date.now(), error: 'Offline' };
    }

    try {
      if (!silent) barcaState.setState('loading');

      // Fetch from Supabase app_cache (ID=1)
      const { data, error } = await supabase
        .from('app_cache')
        .select('data, last_updated')
        .eq('id', '1')
        .single();

      if (error) throw error;
      if (!data || !data.data) throw new Error('No data in cache');

      const resultData = data.data;
      const timestamp = new Date(data.last_updated).getTime();

      // Detect match end and trigger worker sync (if needed, though Worker handles this now)
      if (resultData.matches) {
        this._detectMatchEnd(resultData.matches);
      }

      if (!silent) barcaState.setState('idle');
      return { success: true, data: resultData, timestamp };

    } catch (err) {
      console.error('[BarcaAPI] Error fetching from Supabase:', err);
      if (!silent) barcaState.setState('error');
      return { success: false, data: null, timestamp: Date.now(), error: err.message };
    }
  }

  /**
   * Fetches all matches for FC Barcelona
   * @returns {Promise<Object>}
   */
  async fetchTeamMatches(silent = false) {
    const res = await this.fetchAllData(silent);
    if (res.success) {
      const { live, upcoming, finished } = res.data.matches;
      return {
        success: true,
        data: {
          matches: [...live, ...upcoming, ...finished]
        },
        timestamp: res.timestamp
      };
    }
    return res;
  }

  /**
   * Triggers Worker sync when a match ends
   * @private
   */
  async _triggerWorkerSync() {
    try {
      console.log('[BarcaAPI] Match ended - triggering worker sync...');
      const response = await fetch(CONFIG.API_ENDPOINTS.triggerSync);
      const result = await response.json();
      console.log('[BarcaAPI] Worker sync triggered:', result);
    } catch (error) {
      console.error('[BarcaAPI] Failed to trigger worker sync:', error);
    }
  }

  /**
   * Detects if a match has ended and triggers sync
   * @private
   */
  _detectMatchEnd(matches) {
    const liveMatches = matches.live || [];
    const currentLiveIds = liveMatches.map(m => m.id).sort().join(',');

    // If we had live matches before but now we don't, a match has ended
    if (this._lastMatchStatus && this._lastMatchStatus !== currentLiveIds) {
      const hadLive = this._lastMatchStatus.length > 0;
      const hasLive = currentLiveIds.length > 0;

      // Match ended if we had live matches before but now we have fewer or none
      if (hadLive && (!hasLive || currentLiveIds.length < this._lastMatchStatus.length)) {
        this._triggerWorkerSync();
      }
    }

    this._lastMatchStatus = currentLiveIds;
  }

  /**
   * Internal fetch method with rate-limiting and caching logic
   * @param {string} endpointKey - Key for cache and rate-limiting
   * @param {string} url - Target URL
   * @returns {Promise<Object>} - Standardized response { success, data, timestamp }
   * @private
   */
  async _performFetch(endpointKey, url, silent = false) {
    // 1. Connectivity Check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      barcaState.setState('offline');
      return { success: false, data: null, timestamp: Date.now(), error: 'Offline' };
    }

    // 2. Cache Validation (TTL check)
    const cached = this._cache.get(endpointKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < CONFIG.CACHE_TTL)) {
      return { success: true, data: cached.data, timestamp: cached.timestamp };
    }

    // 3. Rate Limiting Check
    const lastFetch = this._lastFetch.get(endpointKey) || 0;
    if (now - lastFetch < this._rateLimitMs) {
      if (cached) {
        return { success: true, data: cached.data, timestamp: cached.timestamp };
      }
      return { success: false, data: null, timestamp: now, error: 'Rate limit' };
    }

    // 4. Perform Request
    try {
      if (!silent) barcaState.setState('loading');

      const response = await fetch(url);
      if (!response.ok) {
        let errorMsg = `HTTP Error: ${response.status}`;
        try {
          const errorBody = await response.text();
          console.error(`[BarcaAPI] HTTP ${response.status} Body:`, errorBody);
          // Try to parse it if it's JSON
          try {
            const jsonError = JSON.parse(errorBody);
            if (jsonError.message) errorMsg += ` - ${jsonError.message}`;
          } catch (e) { }
        } catch (readError) {
          console.warn('[BarcaAPI] Could not read error body');
        }
        throw new Error(errorMsg);
      }

      let data = await response.json();
      const timestamp = Date.now();

      // Handle array wrapper if present
      if (Array.isArray(data)) {
        data = data[0];
      }

      // Update Cache and Rate Limit timer
      this._cache.set(endpointKey, { data, timestamp });
      this._lastFetch.set(endpointKey, timestamp);
      this._persistCache(endpointKey, data, timestamp);

      // Detect match end and trigger worker sync
      if (endpointKey === 'allData' && data.matches) {
        this._detectMatchEnd(data.matches);
      }

      // Return to idle if everything is fine
      if (!silent && barcaState.getState() === 'loading') {
        barcaState.setState('idle');
      }

      return { success: true, data, timestamp };
    } catch (error) {
      console.error(`[BarcaAPI] Error fetching ${endpointKey}:`, error);
      if (!silent) barcaState.setState('error');
      return { success: false, data: null, timestamp: Date.now(), error: error.message };
    }
  }

  /**
   * Fetches the next match data
   * @returns {Promise<Object>}
   */
  async fetchNextMatch() {
    const res = await this.fetchAllData();
    if (res.success) {
      const { upcoming, live } = res.data.matches;
      return {
        success: true,
        data: live[0] || upcoming[0],
        timestamp: res.timestamp
      };
    }
    return res;
  }

  /**
   * Fetches the league table
   * @param {string} competition - Competition code (e.g., 'PD' or 'CL')
   * @returns {Promise<Object>}
   */
  async fetchLeagueTable(competition = 'PD') {
    const res = await this.fetchAllData();
    if (res.success) {
      const leagueName = (competition === 'PD' || competition === '2014') ? 'La Liga' : 'Champions League';
      const leagueData = res.data.standings.find(s => s.league === leagueName);

      // Map to old format for compatibility if needed, but here we just return what we found
      // Actually, many UI components expect the football-data.org structure
      return {
        success: true,
        data: {
          standings: [
            {
              type: 'TOTAL',
              table: leagueData ? leagueData.table : []
            }
          ]
        },
        timestamp: res.timestamp
      };
    }
    return res;
  }

  /**
   * Fetches the current live scores
   * @returns {Promise<Object>}
   */
  async fetchLiveScore() {
    const res = await this.fetchAllData();
    if (res.success) {
      return {
        success: true,
        data: {
          matches: res.data.matches.live
        },
        timestamp: res.timestamp
      };
    }
    return res;
  }

  /** @private */
  _persistCache(key, data, timestamp) {
    try {
      sessionStorage.setItem(`barca_cache_${key}`, JSON.stringify({ data, timestamp }));
    } catch (e) { }
  }

  /** @private */
  _restoreCache() {
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key.startsWith('barca_cache_')) {
          const endpointKey = key.replace('barca_cache_', '');
          const cached = JSON.parse(sessionStorage.getItem(key));
          this._cache.set(endpointKey, cached);
          this._lastFetch.set(endpointKey, cached.timestamp);
        }
      }
    } catch (e) { }
  }
}

// Export a single instance (Singleton)
export const barcaAPI = new BarcaAPI();
