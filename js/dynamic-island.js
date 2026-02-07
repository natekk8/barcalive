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
        if (!this.island) return;

        // Structure
        this.island.innerHTML = `
            <div id="islandContainer" class="island-container snap-center">
                <div id="dynamicIslandInner" class="island">
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

        this.container = document.getElementById('islandContainer');
        this.expanded = document.getElementById('islandExpanded');
        this.idle = document.getElementById('islandIdle');
        this.islandInner = document.getElementById('dynamicIslandInner');

        // Click wrapper to prevent toggle on drag
        this.islandInner.addEventListener('click', (e) => {
            if (!this.isDragging && !this.justDragged) {
                this.toggle();
            }
            this.justDragged = false;
        });

        this.showOnboarding();
        // this.initDrag(); // Drag disabled by user request (Features removed)
        this.injectStyles(); // Ensure CSS is loaded

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

        const cachedMatches = barcaAPI._cache.get('allData');
        if (cachedMatches && cachedMatches.data) {
            const matches = [...cachedMatches.data.matches.live, ...cachedMatches.data.matches.upcoming, ...cachedMatches.data.matches.finished];
            this.processMatches(matches);
        }

        window.addEventListener('langChanged', () => {
            if (this.data) this.render();
        });

        barcaState.subscribe((state) => {
            if (state === 'live') {
                this.islandInner.classList.add('is-live');
            }
        });
    }

    injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .island-container {
                position: fixed;
                top: 1rem;
                left: 50%;
                transform: translateX(-50%);
                z-index: 9999;
                transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                touch-action: none;
                will-change: transform, left, right;
            }
            .island-container.dragging {
                transition: none;
                cursor: grabbing;
            }
            .island-container.island-blur .island {
                filter: blur(4px);
                transform: scale(0.95);
                transition: filter 0.2s, transform 0.2s;
            }
            
            /* Snap Left */
            .island-container.snap-left { left: 1rem; transform: translateX(0); }
            .island-container.snap-left .island {
                margin-left: 0 !important; margin-right: auto !important;
                transform-origin: top left;
            }
            
            /* Snap Right */
            .island-container.snap-right { left: auto; right: 1rem; transform: translateX(0); }
            .island-container.snap-right .island {
                margin-left: auto !important; margin-right: 0 !important;
                transform-origin: top right;
            }

            /* Snap Center */
            .island-container.snap-center { left: 50%; transform: translateX(-50%); }
             .island-container.snap-center .island {
                margin-left: auto !important; margin-right: auto !important;
                transform-origin: top center;
            }
        `;
        document.head.appendChild(style);
    }

    initDrag() {
        // Drag disabled by user request (Features removed)
    }

    setSnap(position) {
        this.container.classList.remove('snap-left', 'snap-center', 'snap-right');
        this.container.classList.add(`snap-${position}`);
        this.currentSnap = position;
        localStorage.setItem('bp_island_pos', position); // Save preference
    }

    restoreSnap() {
        const saved = localStorage.getItem('bp_island_pos') || 'center';
        this.setSnap(saved);
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
        if (!this._snapRestored) {
            this.restoreSnap();
            this._snapRestored = true;
        }

        if (!this.expanded || !this.islandInner) return;

        // Don't overwrite onboarding if it's currently active
        if (this.onboardingActive && this.islandInner.classList.contains('expanded')) {
            return;
        }

        if (isLive) {
            const liveMatch = this.data;

            // Use API minute if available, else calc
            let minute = '';
            if (liveMatch.minute) {
                // If minute is 45 or 90+ and status is BREAK/HALFTIME, maybe show HT? 
                // But usually API minute is accurate (e.g. "45+2'" or "HT"). 
                // We'll trust API string or number.
                minute = String(liveMatch.minute).includes("'") ? liveMatch.minute : liveMatch.minute + "'";
            } else {
                minute = formatMatchTime(liveMatch.utcDate);
            }

            const isHome = liveMatch.homeTeam.id === this.BARCA_ID;
            const barcaScore = isHome ? (liveMatch.score.fullTime.home || 0) : (liveMatch.score.fullTime.away || 0);
            const oppScore = isHome ? (liveMatch.score.fullTime.away || 0) : (liveMatch.score.fullTime.home || 0);

            let bgClass = "bg-live-neutral";
            if (barcaScore > oppScore) bgClass = "bg-live-win";
            else if (barcaScore < oppScore) bgClass = "bg-live-loss";
            else bgClass = "bg-live-draw";

            // Only update class if changed
            const newClassName = `island is-live ${bgClass} ${this.islandInner.classList.contains('expanded') ? 'expanded' : ''}`;
            if (this.islandInner.className !== newClassName) {
                this.islandInner.className = newClassName;
            }

            const score = `${liveMatch.score.fullTime.home ?? 0} - ${liveMatch.score.fullTime.away ?? 0}`;
            const competition = liveMatch.competition?.name || ''; // "Details in the middle"

            // Idle content
            const newIdleHTML = `
                <div class="flex items-center gap-1.5 px-3">
                    <span class="text-[10px] font-black tracking-tighter">${score}</span>
                    <div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                </div>
            `;
            if (this.idle.innerHTML !== newIdleHTML) this.idle.innerHTML = newIdleHTML;

            // Expanded content with details
            const newExpandedHTML = `
                <div class="flex items-center justify-between w-full h-full px-5 relative">
                     <!-- Competition Detail -->
                    <div class="absolute top-1 left-0 right-0 text-center opacity-40">
                         <span class="text-[8px] font-black uppercase tracking-widest">${competition}</span>
                    </div>

                    <div class="flex flex-col items-center gap-1">
                        <img src="${window.getTeamCrest(liveMatch.homeTeam.name || liveMatch.homeTeam.shortName, liveMatch.homeTeam.crest)}" data-name="${liveMatch.homeTeam.name || liveMatch.homeTeam.shortName}" class="w-8 h-8 object-contain drop-shadow-md" onerror="window.handleLogoError && window.handleLogoError(this)">
                        <span class="text-[10px] font-bold leading-none text-white/90">${liveMatch.homeTeam.displayCode || liveMatch.homeTeam.shortName.substring(0, 3)}</span>
                    </div>

                    <div class="flex flex-col items-center mt-2">
                        <span class="text-2xl font-black tracking-tighter leading-none">${score}</span>
                        <span class="text-[10px] uppercase font-bold text-red-500 animate-pulse mt-0.5">${minute}</span>
                    </div>

                    <div class="flex flex-col items-center gap-1">
                        <img src="${window.getTeamCrest(liveMatch.awayTeam.name || liveMatch.awayTeam.shortName, liveMatch.awayTeam.crest)}" data-name="${liveMatch.awayTeam.name || liveMatch.awayTeam.shortName}" class="w-8 h-8 object-contain drop-shadow-md" onerror="window.handleLogoError && window.handleLogoError(this)">
                        <span class="text-[10px] font-bold leading-none text-white/90">${liveMatch.awayTeam.displayCode || liveMatch.awayTeam.shortName.substring(0, 3)}</span>
                    </div>
                </div>
            `;
            if (this.expanded.innerHTML !== newExpandedHTML) this.expanded.innerHTML = newExpandedHTML;

            this.islandInner.style.boxShadow = "0 8px 30px rgba(0,0,0,0.4)";

        } else if (this.data) {
            // ... (Upcoming logic - update to avoid flicker too)
            const nextMatch = this.data;
            this.islandInner.classList.remove('is-live');
            const newClassName = `island ${this.islandInner.classList.contains('expanded') ? 'expanded' : ''}`;
            if (this.islandInner.className !== newClassName) {
                this.islandInner.className = newClassName;
            }
            this.islandInner.style.background = "";

            const idleHTML = `<div class="w-12 h-1 bg-white/20 rounded-full"></div>`;
            if (this.idle.innerHTML !== idleHTML) this.idle.innerHTML = idleHTML;

            const isHome = nextMatch.homeTeam.id === this.BARCA_ID;
            const opponent = isHome ? nextMatch.awayTeam : nextMatch.homeTeam;
            const date = new Date(nextMatch.utcDate);

            const utcH = date.getUTCHours();
            const isTbd = nextMatch.status === 'SCHEDULED' && (utcH === 0 || utcH === 1 || utcH === 2);
            const time = isTbd ? this.t('tbd') : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const expandedHTML = `
                <div class="flex items-center justify-between w-full h-full px-4">
                    <div class="flex flex-col justify-center">
                        <span class="text-[9px] uppercase font-black text-gold opacity-80 tracking-widest mb-0.5">${this.t('upcoming')}</span>
                        <div class="flex items-center gap-2">
                             <img src="${window.getTeamCrest(opponent.name || opponent.shortName, opponent.crest)}" class="w-4 h-4 object-contain opacity-80">
                             <span class="text-sm font-bold leading-tight line-clamp-1 truncate">${opponent.shortName}</span>
                        </div>
                    </div>
                    <span class="text-xs font-black bg-white/10 px-2 py-1.5 rounded-lg border border-white/5 font-mono">${time}</span>
                </div>
            `;
            if (this.expanded.innerHTML !== expandedHTML) this.expanded.innerHTML = expandedHTML;

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
