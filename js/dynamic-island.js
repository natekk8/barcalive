/**
 * BarcaLive Dynamic Island Module
 * Robust match tracking and status display for all pages.
 */

import { barcaAPI } from '../assets/js/core/api.js';
import { barcaState } from '../assets/js/core/state.js';
import { formatMatchTime } from '../assets/js/core/utils.js';
import { CONFIG } from '../assets/js/core/config.js';
import { barcaPulse } from '../assets/js/live/pulse.js';

class DynamicIsland {
    constructor() {
        this.island = null;
        this.expanded = null;
        this.idle = null;
        this.BARCA_ID = 2017;
        this.data = null;
        this.monitorInterval = null;
        localStorage.removeItem('bp_island_pos'); // Zadanie 2: Clean up
    }



    async init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    async setup() {
        this.island = document.getElementById('dynamic-island');
        if (!this.island) {
            console.warn('Dynamic Island markup not found');
            return;
        }

        // Create inner structure if missing
        this.island.innerHTML = `
            <div class="island-container">
                <div id="dynamicIslandInner" class="island" onclick="window.dynamicIsland.toggle()">
                    <div id="islandContent" class="flex items-center justify-center w-full h-full">
                        <div id="islandIdle" class="w-full flex justify-center items-center">
                            <div class="w-12 h-1 bg-white/20 rounded-full"></div>
                        </div>
                        <div id="islandExpanded" class="flex items-center justify-center w-full h-full px-4" style="display: none;">
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.expanded = document.getElementById('islandExpanded');
        this.idle = document.getElementById('islandIdle');
        this.islandInner = document.getElementById('dynamicIslandInner');

        this.showOnboarding();

        // Restore state
        const isExpanded = sessionStorage.getItem('bp_island_expanded') === 'true';
        if (isExpanded) {
            this.islandInner.classList.add('expanded');
            if (this.idle) this.idle.style.display = 'none';
            if (this.expanded) this.expanded.style.display = 'flex';
        }

        // Subscribe to Smart Polling System
        barcaPulse.subscribe((matches) => {
            this.processMatches(matches);
        });

        // Task: Render immediately if cache exists
        const cachedMatches = barcaAPI._cache.get('allData');
        if (cachedMatches && cachedMatches.data) {
            const matches = [...cachedMatches.data.matches.live, ...cachedMatches.data.matches.upcoming, ...cachedMatches.data.matches.finished];
            this.processMatches(matches);
        }

        // Bug 3/4: Listen for language changes and update immediately
        window.addEventListener('langChanged', () => {
            if (this.data) this.render();
        });

        barcaState.subscribe((state) => {
            if (state === 'live') {
                this.islandInner.classList.add('is-live');
            }
        });
    }

    processMatches(matches) {
        const now = new Date();

        const futureMatches = matches
            .map(match => ({ ...match, parsedDate: new Date(match.utcDate) }))
            .filter(match => match.parsedDate > now)
            .sort((a, b) => a.parsedDate - b.parsedDate);

        const liveMatch = matches.find(m => {
            const isStatusLive = ['LIVE', 'IN_PLAY', 'PAUSED', 'HALFTIME'].includes(m.status);
            if (isStatusLive) return true;

            const start = new Date(m.utcDate);
            const diff = (now - start) / 60000;
            // Backup check: within 2.5h window
            return (diff >= -5 && diff < 135);
        });

        if (liveMatch) {
            barcaState.setState('live');
        } else {
            barcaState.setState('idle');
        }

        this.data = liveMatch || (futureMatches.length > 0 ? futureMatches[0] : null);

        if (this.data) {
            const isLive = !!liveMatch;
            this.render(isLive);
            this.island.style.display = 'block';
        } else {
            this.hide();
        }
    }


    render(isLive = false) {
        if (!this.expanded || !this.islandInner) return;

        // Don't overwrite onboarding if it's currently active
        if (this.onboardingActive && this.islandInner.classList.contains('expanded')) {
            return;
        }

        if (isLive) {
            const liveMatch = this.data;
            const minute = formatMatchTime(liveMatch.utcDate);

            const isHome = liveMatch.homeTeam.id === this.BARCA_ID;
            const barcaScore = isHome ? (liveMatch.score.fullTime.home || 0) : (liveMatch.score.fullTime.away || 0);
            const oppScore = isHome ? (liveMatch.score.fullTime.away || 0) : (liveMatch.score.fullTime.home || 0);

            let bgClass = "bg-live-neutral";
            if (barcaScore > oppScore) bgClass = "bg-live-win";
            else if (barcaScore < oppScore) bgClass = "bg-live-loss";
            else bgClass = "bg-live-draw";

            this.islandInner.className = `island is-live ${bgClass} ${this.islandInner.classList.contains('expanded') ? 'expanded' : ''}`;

            const score = `${liveMatch.score.fullTime.home ?? 0} - ${liveMatch.score.fullTime.away ?? 0}`;

            // Idle state: Show SCORE instead of minute
            this.idle.innerHTML = `
                <div class="flex items-center gap-1.5 px-3">
                    <span class="text-[10px] font-black">${score}</span>
                    <div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                </div>
            `;

            // Expanded state: Show SCORE and MINUTE
            this.expanded.innerHTML = `
                <div class="flex items-center justify-between w-full h-full px-5">
                    <img src="${window.getTeamCrest(liveMatch.homeTeam.name || liveMatch.homeTeam.shortName, liveMatch.homeTeam.crest)}" data-name="${liveMatch.homeTeam.name || liveMatch.homeTeam.shortName}" class="w-10 h-10 object-contain drop-shadow-md transition-transform hover:scale-110" onerror="window.handleLogoError && window.handleLogoError(this)">
                    <div class="flex flex-col items-center">
                        <span class="text-lg font-black tracking-tighter">${score}</span>
                        <span class="text-[9px] uppercase font-black opacity-60">${minute}</span>
                    </div>
                    <img src="${window.getTeamCrest(liveMatch.awayTeam.name || liveMatch.awayTeam.shortName, liveMatch.awayTeam.crest)}" data-name="${liveMatch.awayTeam.name || liveMatch.awayTeam.shortName}" class="w-10 h-10 object-contain drop-shadow-md transition-transform hover:scale-110" onerror="window.handleLogoError && window.handleLogoError(this)">
                </div>
            `;
            this.islandInner.style.boxShadow = "0 8px 30px rgba(0,0,0,0.4)";
        } else if (this.data) {
            const nextMatch = this.data;
            this.islandInner.classList.remove('is-live');
            this.islandInner.className = `island ${this.islandInner.classList.contains('expanded') ? 'expanded' : ''}`;
            this.islandInner.style.background = "";
            this.idle.innerHTML = `<div class="w-12 h-1 bg-white/20 rounded-full"></div>`;

            const isHome = nextMatch.homeTeam.id === this.BARCA_ID;
            const opponent = isHome ? nextMatch.awayTeam : nextMatch.homeTeam;
            const date = new Date(nextMatch.utcDate);

            const utcH = date.getUTCHours();
            const isTbd = nextMatch.status === 'SCHEDULED' && (utcH === 0 || utcH === 1 || utcH === 2);
            const time = isTbd ? this.t('tbd') : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            this.expanded.innerHTML = `
                <div class="flex items-center justify-between w-full h-full px-4">
                    <div class="flex flex-col justify-center">
                        <span class="text-[10px] uppercase font-black text-gold opacity-80 letter-spacing-widest">${this.t('upcoming')}</span>
                        <span class="text-sm font-bold leading-tight line-clamp-1 truncate w-40">${this.t('vs')} ${opponent.shortName}</span>
                    </div>
                    <span class="text-xs font-black bg-white/10 px-2 py-1.5 rounded-xl border border-white/5">${time}</span>
                </div>
            `;
            this.islandInner.style.boxShadow = "";
        }
    }



    toggle() {
        if (!this.islandInner) return;

        if (this.islandInner.classList.contains('expanded')) {
            this.islandInner.classList.remove('expanded');
            sessionStorage.setItem('bp_island_expanded', 'false');
            setTimeout(() => {
                if (this.expanded) this.expanded.style.display = 'none';
                if (this.idle) this.idle.style.display = 'flex';
            }, 100);
        } else {
            this.islandInner.classList.add('expanded');
            sessionStorage.setItem('bp_island_expanded', 'true');
            if (this.idle) this.idle.style.display = 'none';
            setTimeout(() => {
                if (this.expanded) this.expanded.style.display = 'flex';
            }, 150);
        }
    }

    showOnboarding() {
        // Only show for first-time visitors
        if (localStorage.getItem('bp_onboarding_seen')) {
            return;
        }

        this.onboardingActive = true;

        setTimeout(() => {
            if (!this.islandInner || !this.expanded) return;

            this.islandInner.classList.add('expanded');
            sessionStorage.setItem('bp_island_expanded', 'true');
            if (this.idle) this.idle.style.display = 'none';
            this.expanded.style.display = 'flex';

            this.expanded.innerHTML = `
                <div class="flex flex-col items-center text-center max-w-[280px] relative">
                    <button onclick="event.stopPropagation(); window.dynamicIsland.closeOnboarding()" class="absolute -right-4 -top-2 p-2 opacity-50 hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <span class="text-gold font-black text-[9px] uppercase tracking-[0.2em] mb-1">${this.t('onboardingTitle')}</span>
                    <p class="text-white text-[11px] leading-tight font-medium opacity-90">${this.t('onboardingDesc')}</p>
                </div>
            `;
        }, 1000);

        // Auto close after 15 seconds
        this.onboardingTimeout = setTimeout(() => {
            this.closeOnboarding();
        }, 15000);
    }

    closeOnboarding() {
        if (!this.onboardingActive) return;

        this.onboardingActive = false;
        localStorage.setItem('bp_onboarding_seen', 'true');
        clearTimeout(this.onboardingTimeout);

        if (this.islandInner) {
            this.islandInner.classList.remove('expanded');
            sessionStorage.setItem('bp_island_expanded', 'false');
            if (this.expanded) this.expanded.style.display = 'none';
            if (this.idle) this.idle.style.display = 'flex';

            // Re-render if we have data
            if (this.data) {
                const isLive = barcaState.getState() === 'live';
                this.render(isLive);
            }
        }
    }

    hide() {
        if (this.island) this.island.style.display = 'none';
    }

    t(key) {
        return (window.I18n && window.I18n.t(key)) || key;
    }
}



const dynamicIsland = new DynamicIsland();
dynamicIsland.init();
window.dynamicIsland = dynamicIsland;

export default DynamicIsland;
