const BARCA_ID = 2017;

// SofaScore Team IDs for Crests
const TEAM_CRESTS = {
    'FC Barcelona': 2017,
    'Real Madryt': 2016,
    'Atlético Madryt': 2020,
    'Villarreal': 2023,
    'Real Sociedad': 2028,
    'Betis Sevilla': 2022,
    'Athletic Bilbao': 2019,
    'Rayo Vallecano': 2054,
    'Girona FC': 2101,
    'Osasuna': 2024,
    'Celta de Vigo': 2025,
    'Valencia': 2015,
    'Sevilla': 2021,
    'Getafe CF': 2056,
    'Mallorca': 2027,
    'Espanyol Barcelona': 2032,
    'Alaves': 2018,
    'Las Palmas': 2052,
    'Cadiz': 2041,
    'Granada': 2038,
    'Almeria': 2042,
    'Elche CF': 2043,
    'Levante': 2036,
    'Real Oviedo': 2336,
    'R. Oviedo': 2336,
    'Albacete Balompie': 2026,
    'Racing Santander': 2029,
    'Arsenal Londyn': 42,
    'Bayern Monachium': 2672,
    'Liverpool FC': 44,
    'Tottenham Hotspur': 33,
    'Chelsea Londyn': 38,
    'Sporting Lizbona': 3001,
    'Manchester City': 17,
    'Inter Mediolan': 2697,
    'PSG': 1644,
    'Newcastle United': 39,
    'Juventus Turyn': 2687,
    'Atalanta BC': 2686,
    'Bayer Leverkusen': 2681,
    'Borussia Dortmund': 2673,
    'Olympiakos Pireus': 3222,
    'Club Brugge KV': 2287,
    'Galatasaray SK': 3061,
    'AS Monaco': 1623,
    'Qarabağ': 3224,
    'Bodø / Glimt': 635,
    'Benfica Lizbona': 3002,
    'Olympique Marsylia': 1641,
    'Pafos FC': 5851,
    'St. Gilloise': 2341,
    'PSV': 2522,
    'Napoli': 2692,
    'FC Kopenhaga': 600,
    'Ajax Amsterdam': 2485,
    'Eintracht Frankfurt': 2679,
    'SK Slavia Praga': 533,
    'Kairat': 2596
};

// Custom Channel Mappings (API Name -> Filename)
const CHANNEL_LOGO_MAP = {
    "Canal+ Sport": "canal-plus-sport-pl.png",
    "Canal+ Sport 2": "canal-plus-sport-2-pl.png",
    "Canal+ Sport 3": "canal-plus-sport-3-pl.png",
    "Canal+ Sport 4": "canal-plus-sport-4-pl.png",
    "Canal+ Sport 5": "canal-plus-sport-5-pl.png",
    "Canal+ Now": "canal-plus-now-pl.png",
    "DAZN": "dazn-int.png",
    "DAZN 1": "dazn1-int.png",
    "DAZN 2": "dazn2-int.png",
    "Eleven Sports": "eleven-sports-int.png",
    "Eleven Sports 1": "eleven-sports-1-int.png",
    "Eleven Sports 2": "eleven-sports-2-int.png",
    "Eleven Sports 3": "eleven-sports-3-int.png",
    "Eleven Sports 4": "eleven-sports-4-int.png",
    "Eleven Sports 5": "eleven-sports-5-int.png",
    "Eleven Sports 6": "eleven-sports-6-int.png",
    "Polsat Sport": "polsat-sport-pl.png",
    "Polsat Sport 1": "polsat-sport-1-pl.png",
    "Polsat Sport 2": "polsat-sport-2-pl.png",
    "Polsat Sport 3": "polsat-sport-3-pl.png",
    "Polsat Sport Extra": "polsat-sport-extra-pl.png",
    "Polsat Sport Extra 1": "polsat-sport-extra-1-pl.png",
    "Polsat Sport Extra 2": "polsat-sport-extra-2-pl.png",
    "Polsat Sport Extra 3": "polsat-sport-extra-3-pl.png",
    "Polsat Sport Extra 4": "polsat-sport-extra-4-pl.png",
    "Polsat Sport Fight": "polsat-sport-fight-pl.png",
    "Polsat Sport News": "polsat-sport-news-pl.png",
    "Polsat Sport Premium 1": "polsat-sport-premium-1-pl.png",
    "Polsat Sport Premium 2": "polsat-sport-premium-2-pl.png",
    "Red Bull TV": "red-bull-tv-int.png",
    "TVP Sport": "tvp-sport-pl.png",
    "TVP Sport HD": "tvp-sport-hd-pl.png",
    // Competitions
    "Champions League": "cl.png",
    "La Liga": "pd.png",
    "Copa del Rey": "cdr.png",
    "Supercopa de Espana": "scde.png"
};

const LOGO_BASE_URL = "https://bwmkvehxzcdzdxiqdqin.supabase.co/storage/v1/object/public/logos";

function getTeamCrest(name, existingCrest) {
    if (!name) return existingCrest || `https://api.sofascore.app/api/v1/team/0/image`;

    // Sanitize name to match filename logic in sync script
    const safeName = name.replace(/[\/\\?%*:|"<>]/g, '-');

    // Return local logo path (script downloads it as Team Name.png)
    return `assets/logos/${safeName}.png`;
}

// Expose for other modules
window.getTeamCrest = getTeamCrest;

// ... (existing helper function if needed, or I'll implement date diff for minute)
function getMatchMinute(utcDate) {
    const start = new Date(utcDate);
    const now = new Date();
    const diff = Math.floor((now - start) / 60000);
    if (diff < 0) return '0\'';
    if (diff > 45 && diff < 60) return 'HT'; // Rough estimate
    if (diff > 90) return '90+\'';
    return diff + '\'';
}

window.handleLogoError = function (img) {
    const name = img.dataset.name;
    if (!name) {
        img.src = 'https://api.sofascore.app/api/v1/team/2017/image';
        return;
    }

    // Fallback to SofaScore API if local logo is missing
    const id = TEAM_CRESTS[name] || TEAM_CRESTS[Object.keys(TEAM_CRESTS).find(k => name && (name.includes(k) || k.includes(name)))];

    if (id) {
        img.src = `https://api.sofascore.app/api/v1/team/${id}/image`;
    } else {
        img.src = 'https://api.sofascore.app/api/v1/team/2017/image'; // Ultimate fallback (Barca)
    }
    img.onerror = null;
};

// --- THEME LOGIC ---
window.toggleTheme = function () {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('bp_theme', isLight ? 'light' : 'dark');
    window.updateThemeIcons();

    // Refresh Next Match Component to update logo
    if (window.initOverview && window.currentPage === 'overview') {
        // We can just call renderNextMatch if we have the data, but fetching is safer to ensure state consistency
        // Or better: Reload page? No.
        // Let's rely on cached data
        const cached = barcaAPI._cache.get('allData');
        if (cached && cached.data) {
            const live = cached.data.matches.live?.[0];
            const upcoming = cached.data.matches.upcoming?.[0];
            if (live || upcoming) window.renderNextMatch(live || upcoming, !!live);
        }
    }

    // Refresh components to update toggle visual state
    if (window.initComponents && window.currentPage) {
        window.initComponents(window.currentPage);
    }
};

window.updateThemeIcons = function () {
    const isLight = document.body.classList.contains('light-theme');
    document.querySelectorAll('.dark-icon').forEach(el => el.style.display = isLight ? 'none' : 'block');
    document.querySelectorAll('.light-icon').forEach(el => el.style.display = isLight ? 'block' : 'none');
};

// --- NOTIFICATIONS ---
const NotificationManager = {
    async requestPermission() {
        if (!("Notification" in window)) {
            console.warn("Notifications not supported");
            return false;
        }
        if (Notification.permission === "granted") return true;
        if (Notification.permission === "denied") {
            alert("Notification permission was denied. Please enable it in browser settings.");
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            return permission === "granted";
        } catch (e) {
            // Fallback for older browsers
            return new Promise((resolve) => {
                Notification.requestPermission((p) => resolve(p === "granted"));
            });
        }
    },

    send(title, body) {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        new Notification(title, { body });
    }
};

window.getNotificationSetting = (key) => {
    const settings = JSON.parse(localStorage.getItem('bp_notifications') || '{}');
    return !!settings[key]; // Default false
};

window.toggleNotification = async function (key) {
    const settings = JSON.parse(localStorage.getItem('bp_notifications') || '{}');
    const newState = !settings[key];

    if (newState) {
        const granted = await NotificationManager.requestPermission();
        if (!granted) return;
    }

    settings[key] = newState;
    localStorage.setItem('bp_notifications', JSON.stringify(settings));

    // Refresh UI
    if (window.initComponents && window.currentPage) {
        window.initComponents(window.currentPage);
    }
};

// --- MOBILE REDIRECTION (REMOVED) ---
function checkMobile() {
    // Redirection disabled. System is now fully responsive.
}


function initTheme() {
    const storedTheme = localStorage.getItem('bp_theme');
    if (storedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
    window.updateThemeIcons();
}


// --- DOMContentLoaded Wrapper ---
document.addEventListener('DOMContentLoaded', () => {
    // 0. Check Mobile
    checkMobile();

    // 1. Init Theme (Persistence Fix)
    initTheme();

    // 2. Init Language (Persistence Fix)
    if (window.I18n && !window.I18n.initialized) {
        window.I18n.init();
    }

    // 3. Set Date
    const dateEl = document.getElementById('date-display');
    if (dateEl) {
        const today = new Date();
        // Use I18n format if available
        const dateStr = window.I18n ? window.I18n.formatDate(today, { month: 'long', day: 'numeric', year: 'numeric' }) : today.toDateString();
        dateEl.innerText = dateStr;
    }

    // 4. Island Toggle Logic (REMOVED - Handled by dynamic-island.js)


    // 5. Global Match Monitoring (NOTIFICATIONS ONLY)
    let lastMatchState = null;

    async function monitorMatches() {
        if (typeof API !== 'undefined' && API.getMatches) {
            try {
                const matchesData = await API.getMatches();
                if (!matchesData) return;

                const matches = matchesData.matches;
                const today = new Date();
                const nextMatch = matches.find(m => new Date(m.utcDate) > today);
                const liveMatch = matches.find(m => ['IN_PLAY', 'PAUSED'].includes(m.status));

                // Notification Logic
                const currentMatch = liveMatch || nextMatch;
                if (currentMatch) {
                    if (lastMatchState && lastMatchState.id === currentMatch.id) {
                        // Check for changes (Goals, Start/End)
                        if (window.getNotificationSetting('goals')) {
                            const oldScore = lastMatchState.score.fullTime;
                            const newScore = currentMatch.score.fullTime;
                            if (newScore.home !== oldScore.home || newScore.away !== oldScore.away) {
                                NotificationManager.send(
                                    `GOAL! ${currentMatch.homeTeam.shortName} ${newScore.home} - ${newScore.away} ${currentMatch.awayTeam.shortName}`,
                                    `${currentMatch.competition.name}`
                                );
                            }
                        }

                        if (window.getNotificationSetting('matchStatus')) {
                            if (currentMatch.status !== lastMatchState.status) {
                                let msg = "";
                                if (currentMatch.status === 'IN_PLAY' && lastMatchState.status === 'TIMED') msg = "Match Started!";
                                if (currentMatch.status === 'FINISHED') msg = "Match Finished!";
                                if (currentMatch.status === 'PAUSED') msg = "Halftime!";
                                if (msg) NotificationManager.send(msg, `${currentMatch.homeTeam.shortName} vs ${currentMatch.awayTeam.shortName}`);
                            }
                        }
                    }
                    lastMatchState = JSON.parse(JSON.stringify(currentMatch)); // Clone
                }

                if (!window.matchMonitorInterval) {
                    window.matchMonitorInterval = setInterval(monitorMatches, 60000);
                }
            } catch (err) {
                console.error("Notification monitor error:", err);
            }
        }
    }
    window.initGlobalMonitor = monitorMatches;
    monitorMatches();

    // 6. Subscribe to BarcaPulse for auto-refresh during live matches
    if (window.barcaPulse) {
        window.barcaPulse.subscribe((matches) => {
            // Only auto-refresh if we're on overview page
            if (window.location.pathname.includes('overview') || window.location.pathname === '/' || window.location.pathname === '/index.html') {
                if (window.initOverview) {
                    window.initOverview();
                }
            }
        });
    }
});




// --- GLOBAL EXPORTS ---
window.initOverview = initOverview;
window.initLaLiga = initLaLiga;
window.initUCL = initUCL;
window.initSchedule = initSchedule;

window.initOverviewPage = () => {
    if (window.initComponents) window.initComponents('overview');
    initOverview();
};

window.initLaLigaPage = () => {
    if (window.initComponents) window.initComponents('laliga');
    initLaLiga();
};

window.initUCLPage = () => {
    if (window.initComponents) window.initComponents('ucl');
    initUCL();
};

window.initSchedulePage = () => {
    if (window.initComponents) window.initComponents('schedule');
    initSchedule('upcoming');
};

window.initResultsPage = () => {
    if (window.initComponents) window.initComponents('schedule');
    initSchedule('results');
};

// --- OVERVIEW ---
let currentLiveMatch = null;
let minuteUpdateInterval = null;
async function initOverview() {
    const res = await window.barcaAPI.fetchAllData();

    if (!res.success || !res.data) return;

    const { matches, standings } = res.data;

    // Get live match from matches.live array
    const liveMatch = matches.live?.[0];

    // Get next upcoming match
    const nextMatch = matches.upcoming?.[0];

    // Get recent finished matches for form
    const isSmallScreen = window.innerWidth <= 768;
    const formCount = isSmallScreen ? 3 : 6;
    const pastMatches = (matches.finished || []).slice(0, formCount).reverse();

    // Ambient Mode Check
    if (liveMatch) {
        document.body.classList.add('match-live');
        currentLiveMatch = liveMatch;
        startMinuteUpdater();
    } else {
        document.body.classList.remove('match-live');
        currentLiveMatch = null;
        stopMinuteUpdater();
    }

    // Show live match if available, otherwise show next match
    const matchToShow = liveMatch || nextMatch;
    const isLiveMatch = !!liveMatch;
    renderNextMatch(matchToShow, isLiveMatch, standings);
    renderRecentForm(pastMatches);
    initWhereToWatch();
}


function startMinuteUpdater() {
    stopMinuteUpdater(); // Clear any existing interval

    minuteUpdateInterval = setInterval(() => {
        if (currentLiveMatch) {
            updateLiveMinute(currentLiveMatch);
        }
    }, 1000); // Update every second
}

function stopMinuteUpdater() {
    if (minuteUpdateInterval) {
        clearInterval(minuteUpdateInterval);
        minuteUpdateInterval = null;
    }
}

function updateLiveMinute(match) {
    const minuteElement = document.querySelector('[data-live-minute]');
    if (!minuteElement) return;

    // Use fresh match data if available
    const freshMatch = currentLiveMatch || match;

    // Use API provided minute if available (more accurate)
    if (freshMatch.minute) {
        minuteElement.textContent = freshMatch.minute + "'";
        return;
    }

    const start = new Date(freshMatch.utcDate);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);

    let minute = '';

    // Same logic as formatMatchTime in utils.js
    if (diffMins >= 0 && diffMins <= 135) {
        if (diffMins > 45 && diffMins <= 60) {
            minute = 'HT';
        } else {
            const actualMin = diffMins > 60 ? diffMins - 15 : diffMins;
            minute = actualMin + "'";
        }
    } else if (diffMins < 0) {
        minute = "LIVE";
    } else {
        minute = "FT";
    }

    minuteElement.textContent = minute;
}


function renderNextMatch(match, isLive = false, standings = []) {
    const container = document.getElementById('next-match-container');
    if (!match) {
        if (container) container.innerHTML = `<div class="text-center opacity-50">${t('tbd')}</div>`;
        return;
    }
    if (!container) return;

    // Use passed isLive flag OR check status as fallback
    isLive = isLive || ['IN_PLAY', 'PAUSED', 'LIVE', 'HALFTIME'].includes(match.status);

    console.log('[renderNextMatch] isLive:', isLive, 'status:', match.status);

    // Helper to find position
    const getPosition = (teamId, teamName, currentPos) => {
        if (currentPos) return currentPos;
        if (!standings || !standings.length) return null;

        // Flatten standings tables (handling multiple leagues/groups)
        for (const s of standings) {
            const found = s.table.find(row => (row.team && row.team.id === teamId) || row.name === teamName || row.name === team.shortName); // team.shortName not available here directly, use passed name?
            // Actually table row has .name or .team.name.
            // Let's iterate.
            const row = s.table.find(r => {
                if (r.team && r.team.id === teamId) return true;
                if (r.name && (r.name === teamName || r.name.includes(teamName))) return true;
                return false;
            });
            if (row) return row.pos || row.position;
        }
        return null;
    };

    // Logic for Smart Positions
    const shouldShowPosition = (match) => {
        const comp = match.competition.code || match.competition.name;
        const stage = match.stageName || '';

        // Always show for La Liga (PD)
        if (comp === 'PD' || comp === 'PFL' || match.competition.name.includes('La Liga')) return true;

        // Show for Champions League ONLY if League Phase
        if (comp === 'CL' || match.competition.name.includes('Champions') || match.competition.name.includes('Mistrzów')) {
            if (stage.includes('League') || stage.includes('Ligowa') || stage.includes('Regular')) return true;
            return false;
        }

        // Default to false for Cups (Copa del Rey, Supercopa)
        return false;
    };

    const showPos = shouldShowPosition(match);
    const homePos = showPos ? getPosition(match.homeTeam.id, match.homeTeam.name || match.homeTeam.shortName, match.homeTeam.competitionPosition) : null;
    const awayPos = showPos ? getPosition(match.awayTeam.id, match.awayTeam.name || match.awayTeam.shortName, match.awayTeam.competitionPosition) : null;


    // Competition Logo Logic
    const getCompLogo = (code, name) => {
        const baseUrl = 'https://bwmkvehxzcdzdxiqdqin.supabase.co/storage/v1/object/public/logos/competition';
        const isDark = !document.body.classList.contains('light-theme');
        const themeSuffix = isDark ? '-dark' : '-light';

        // Normalize name for checking
        const n = name.toLowerCase();

        // Strict Mappings based on User Feedback
        // Strict Mappings based on User Feedback
        if (code === 'CDR' || n.includes('copa del rey') || n.includes('puchar')) return `${baseUrl}/cdr${themeSuffix}.png`;
        if (code === 'SC' || n.includes('supercopa') || n.includes('superpuchar')) return `${baseUrl}/scde${themeSuffix}.png`;
        if (code === 'PD' || n.includes('la liga') || n.includes('primera')) return `${baseUrl}/pd${themeSuffix}.png`;
        if (code === 'CL' || n.includes('champions') || n.includes('liga mistrz')) return `${baseUrl}/ucl${themeSuffix}.png`; // Stricter 'mistrz' check
    };
    const compLogo = getCompLogo(match.competition.code, match.competition.name);


    // Logic for Time/Score and Date/Minute
    let mainDisplay = '';
    let subDisplay = '';

    if (isLive) {
        const homeScore = match.score?.fullTime?.home ?? 0;
        const awayScore = match.score?.fullTime?.away ?? 0;
        mainDisplay = `${homeScore} - ${awayScore}`;

        // Calculate minute using API or same logic as formatMatchTime
        if (match.minute) {
            subDisplay = String(match.minute).includes("'") ? match.minute : match.minute + "'";
        } else {
            const start = new Date(match.utcDate);
            const now = new Date();
            const diffMins = Math.floor((now - start) / 60000);

            let minute = '';
            // Auto-detect LIVE status (matches started in the last 135 minutes)
            if (diffMins >= 0 && diffMins <= 135) {
                if (diffMins > 45 && diffMins <= 60) minute = "HT";
                else {
                    const actualMin = diffMins > 60 ? diffMins - 15 : diffMins;
                    minute = actualMin + "'";
                }
            } else {
                minute = "LIVE";
            }
            subDisplay = minute;
        }

    } else {
        mainDisplay = new Date(match.utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        subDisplay = window.I18n?.formatDate ? window.I18n.formatDate(match.utcDate, { weekday: 'long', month: 'long', day: 'numeric' }) : new Date(match.utcDate).toLocaleDateString();
    }


    // Parent container styling based on live state
    const parentContainer = container.closest('.glass-premium');
    if (parentContainer) {
        if (isLive) {
            parentContainer.classList.add('match-card-live');
        } else {
            parentContainer.classList.remove('match-card-live');
        }
    }

    // Shirt Colors for dynamic glow
    const homeColor = match.homeTeam.homeShirtColor || '#ffffff';

    // Referee, Round, Venue, Stage
    let roundInfo = '';
    if (match.currentRound) {
        // If round is just a number (e.g. 23), prefix with "KOLEJKA"
        // If it's text (e.g. "Półfinał"), show as is
        const isNumeric = /^\d+$/.test(String(match.currentRound));
        roundInfo = isNumeric ? `KOLEJKA ${match.currentRound}` : match.currentRound;
    } else if (match.displayName) {
        roundInfo = match.displayName;
    }

    const refereeInfo = match.referee?.displayName ? `Sędzia: ${match.referee.displayShortName || match.referee.displayName}` : '';
    const venueInfo = match.venue || ''; // Removed "@" as requested
    const stageInfo = (match.stageName && match.stageName !== match.competition.name) ? match.stageName : '';

    const metaInfoParts = [stageInfo, roundInfo, venueInfo, refereeInfo].filter(Boolean);
    const metaInfo = metaInfoParts.join(' • ');

    container.innerHTML = `
        <div class="flex flex-col items-center w-full relative" style="padding-top: 3rem;"> <!-- Increased padding for tile -->
            <!-- Badge in top-left corner -->
            ${isLive ? `
            <div class="absolute -top-3 left-0 z-10">
                <span class="inline-flex items-center gap-2 bg-red-500 text-white live-badge px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg">
                    <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    LIVE
                </span>
            </div>
            ` : `
            <div class="absolute -top-3 left-0 z-10">
                <span style="background: rgba(237, 187, 0, 0.15); color: var(--gold);" class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gold/30">
                    <span class="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span>
                    ${t('nextMatch') || 'Następny mecz'}
                </span>
            </div>
            `}

            <!-- Competition Logo Tile (Centered Top) -->
            <div class="absolute -top-10 left-0 right-0 mx-auto w-fit z-20 flex justify-center pointer-events-none">
                 <div class="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-[20px] md:rounded-[28px] flex items-center justify-center border border-white/10 shadow-xl backdrop-blur-md pointer-events-auto">
                     <img src="${compLogo}" class="w-10 h-10 md:w-14 md:h-14 object-contain filter drop-shadow-md theme-logo" 
                          data-code="${match.competition.code}" 
                          data-name="${match.competition.name}"
                          onerror="this.style.display='none'" 
                          title="${match.competition.name}">
                 </div>
            </div>

            <!-- Meta Info (Round / Referee / Venue) -->
            ${metaInfo ? `<div class="absolute top-2 right-0 text-[8px] md:text-[9px] font-bold opacity-40 uppercase tracking-wider text-right max-w-[60%] leading-tight">${metaInfo}</div>` : ''}

            <div class="flex flex-col md:flex-row items-center gap-6 md:gap-16 animate-in w-full justify-center pt-8">
                <div class="text-center relative group">
                    <div class="w-20 h-20 md:w-32 md:h-32 bg-white/5 rounded-[24px] md:rounded-[40px] flex items-center justify-center border border-white/10 mb-3 mx-auto shadow-xl transition-all hover:scale-105"
                         style="box-shadow: 0 0 30px ${homeColor}20;"> <!-- Dynamic Shadow -->
                        <img src="${getTeamCrest(match.homeTeam.name || match.homeTeam.shortName, match.homeTeam.crest)}" data-name="${match.homeTeam.name || match.homeTeam.shortName}" class="w-12 md:w-20 object-contain" loading="lazy" referrerpolicy="no-referrer" onerror="handleLogoError(this)">
                    </div>
                    <h3 class="font-bold text-xs md:text-xl flex items-center justify-center gap-2">
                        ${match.homeTeam.shortName}
                        
                    </h3>
                </div>

                <div class="flex flex-col items-center -mt-2 md:mt-0">
                     <!-- Competition Name Only (Logo moved to top) -->
                     <div class="flex flex-col items-center mb-1 gap-1 opacity-80">
                        <span class="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-center max-w-[120px] leading-tight text-gold">${t(match.competition.name) || match.competition.name}</span>
                     </div>

                     <span class="text-[2.5rem] md:text-[3.5rem] font-black tracking-tighter leading-none ${isLive ? 'text-red-500' : ''}">${mainDisplay}</span>
                     <span class="text-[10px] md:text-sm font-bold ${isLive ? 'text-gold' : 'opacity-50'} uppercase tracking-widest mt-2 whitespace-nowrap" ${isLive ? 'data-live-minute' : ''}>${subDisplay}</span>
                </div>

                <div class="text-center relative group">
                     <div class="w-20 h-20 md:w-32 md:h-32 bg-white/5 rounded-[24px] md:rounded-[40px] flex items-center justify-center border border-white/10 mb-3 mx-auto shadow-xl transition-all hover:scale-105">
                        <img src="${getTeamCrest(match.awayTeam.name || match.awayTeam.shortName, match.awayTeam.crest)}" data-name="${match.awayTeam.name || match.awayTeam.shortName}" class="w-12 md:w-20 object-contain" loading="lazy" referrerpolicy="no-referrer" onerror="handleLogoError(this)">
                    </div>
                    <h3 class="font-bold text-xs md:text-xl flex items-center justify-center gap-2">
                        ${match.awayTeam.shortName}
                        ${awayPos ? `<span class="bg-white/10 text-[9px] px-1.5 py-0.5 rounded text-white/60 font-mono" title="Pozycja w lidze">#${awayPos}</span>` : ''}
                    </h3>
                </div>

            </div>
        </div>
    `;

}


function renderRecentForm(matches) {
    const container = document.getElementById('recent-form-container');
    if (!matches || matches.length === 0) return;

    container.innerHTML = matches.map((m, index) => {
        const isHome = m.homeTeam.id === BARCA_ID;
        const opponent = isHome ? m.awayTeam : m.homeTeam;
        const result = m.score.fullTime.home !== null ?
            `${m.score.fullTime.home} - ${m.score.fullTime.away}` : "?";

        const barcaScore = isHome ? m.score.fullTime.home : m.score.fullTime.away;
        const oppScore = isHome ? m.score.fullTime.away : m.score.fullTime.home;
        let resultColor = barcaScore > oppScore ? 'text-green-400' : (barcaScore < oppScore ? 'text-red-400' : 'text-yellow-400');
        const winLabel = barcaScore > oppScore ? 'W' : (barcaScore < oppScore ? 'L' : 'D');

        return `
            <div class="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 hover:bg-white/5 p-2 rounded-lg transition-colors" 
                 style="animation: slideUp 0.4s ease forwards; animation-delay: ${index * 100}ms; opacity: 0;">
                <div class="flex items-center gap-3">
                    <img src="${getTeamCrest(opponent.name || opponent.shortName, opponent.crest)}" data-name="${opponent.name || opponent.shortName}" class="w-6 h-6 object-contain" loading="lazy" referrerpolicy="no-referrer" onerror="handleLogoError(this)">
                    <span class="text-sm font-medium opacity-80">vs ${opponent.shortName}</span>
                </div>
                <span class="${resultColor} font-bold text-sm">${result} <span class="opacity-50 ml-1 text-xs">${winLabel}</span></span>
            </div>

        `;
    }).join('');
}


// --- DYNAMIC ISLAND LOGIC (REMOVED) ---




// --- LA LIGA & UCL TABLES ---
async function initLaLiga() {
    const data = await API.getStandings(2014); // PD
    if (!data) return;
    const tableData = data.standings.find(s => s.type === 'TOTAL').table;
    const container = document.getElementById('laliga-standings-container');
    renderFootballTable(container, tableData, 'laliga');
}

// --- UCL: Groups Implementation ---
async function initUCL() {
    const data = await API.getUCLStandings();
    const container = document.getElementById('ucl-standings-container');

    if (!data || !data.standings) {
        container.innerHTML = `<div class="p-8 text-center bg-white/5 rounded-2xl border border-white/10">
            <p class="opacity-60 mb-2">Data currently unavailable</p>
            <span class="text-xs uppercase font-bold text-gold">Check back later</span>
        </div>`;
        return;
    }

    // Filter for TOTAL standings (ignore HOME/AWAY)
    const totalStandings = data.standings.filter(s => s.type === 'TOTAL');

    if (totalStandings.length === 0) {
        container.innerHTML = `<div class="p-4 opacity-50">No standings available.</div>`;
        return;
    }

    let html = `<div class="flex flex-col gap-12 pt-4">`;

    totalStandings.forEach(groupStanding => {
        const groupName = groupStanding.group ? groupStanding.group.replace('_', ' ') : 'League Table';
        const gid = groupStanding.group || 'league';
        html += `
            <div class="animate-in">
                <div class="glass-header mb-4">
                    <span class="text-xs font-black uppercase tracking-[0.15em] opacity-40">${groupName}</span>
                </div>
                <div class="overflow-x-auto" id="ucl-${gid}"></div>
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;

    totalStandings.forEach(groupStanding => {
        const gid = groupStanding.group || 'league';
        const subContainer = document.getElementById(`ucl-${gid}`);
        if (subContainer) {
            renderFootballTable(subContainer, groupStanding.table, 'ucl');
        }
    });
}



// Shared Table Render (La Liga full width)
async function renderFootballTable(container, tableData, competitionType = 'league') {
    let html = `
        <div class="table-wrapper">
        <table class="football-table">
            <thead>
                <tr>
                    <th width="36">Pos</th>
                    <th>Club</th>
                    <th class="text-center">PL</th>
                    <th class="hidden sm:table-cell text-center">W-D-L</th>
                    <th class="text-center">GD</th>
                    <th class="text-right">PTS</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Map new API structure to UI expectations
    html += tableData.map((row, idx) => {
        // Handle new API properties vs old ones
        const position = row.pos || row.position;
        const name = row.name || (row.team ? row.team.shortName : 'Unknown');
        const isBarca = name === 'FC Barcelona' || (row.team && row.team.id === BARCA_ID);
        const played = row.m ?? row.playedGames ?? 0;
        const won = row.w ?? row.won ?? 0;
        const draw = row.d ?? row.draw ?? 0;
        const lost = row.l ?? row.lost ?? 0;
        const points = row.p ?? row.points ?? 0;

        let gd = row.goalDifference ?? 0;
        if (row.goals && typeof row.goals === 'string' && row.goals.includes(':')) {
            const [scored, conceded] = row.goals.split(':').map(Number);
            gd = scored - conceded;
        }

        // Crest handling - if missing, try to find a placeholder or use mapping
        const crest = getTeamCrest(name, row.crest || row.team?.crest);

        let posClass = '';
        if (row.promotion) {
            // Map known API promotion strings to classes
            const p = row.promotion.toLowerCase();
            if (p.includes('liga mistrzów') || p.includes('champions league') || p.includes('awans')) posClass = 'pos-cl';
            else if (p.includes('liga europy') || p.includes('europa league')) posClass = 'pos-el';
            else if (p.includes('konferencji') || p.includes('conference')) posClass = 'pos-ecl';
            else if (p.includes('spadek') || p.includes('relegation')) posClass = 'pos-rel';
        } else {
            // Fallback to position-based logic if API data missing
            if (competitionType === 'laliga') {
                if (position <= 4) posClass = 'pos-cl';
                else if (position === 5) posClass = 'pos-el';
                else if (position === 6) posClass = 'pos-ecl';
                else if (position >= 18) posClass = 'pos-rel';
            } else if (competitionType === 'ucl') {
                if (tableData.length > 20) { // New format
                    if (position <= 8) posClass = 'pos-cl';
                    else if (position <= 24) posClass = 'pos-el';
                    else posClass = 'pos-rel';
                } else { // Group format
                    if (position <= 2) posClass = 'pos-cl';
                    else if (position === 3) posClass = 'pos-el';
                    else posClass = 'pos-rel';
                }
            }
        }

        return `
            <tr class="${isBarca ? 'highlight-barca' : ''} animate-in" 
                style="animation-delay: ${idx * 30}ms;">
                <td class="font-black text-xs ${posClass}">${position}</td>
                <td>
                    <div class="flex items-center gap-3 py-1">
                        ${crest ? `<img src="${crest}" data-name="${name}" class="w-7 h-7 object-contain" loading="lazy" referrerpolicy="no-referrer" onerror="handleLogoError(this)">` : ''}
                        <span class="font-bold ${isBarca ? 'text-gold' : ''} text-xs md:text-base">${name}</span>
                    </div>
                </td>

                <td class="text-center opacity-40 font-bold text-xs">${played}</td>
                <td class="hidden sm:table-cell text-center opacity-40 text-[10px] font-black tracking-tighter">
                    ${won}-${draw}-${lost}
                </td>
                <td class="text-center font-bold text-xs ${gd > 0 ? 'text-green-400' : (gd < 0 ? 'text-red-400' : 'opacity-30')}">
                    ${gd > 0 ? '+' : ''}${gd || 0}
                </td>
                <td class="text-right font-black text-lg tracking-tighter">${points}</td>
            </tr>
        `;
    }).join('');
    html += `</tbody></table></div>`;
    container.innerHTML = html;
}


// --- SCHEDULE & RESULTS REDESIGN ---
async function initSchedule(defaultView = 'upcoming') {
    const data = await API.getMatches();
    if (!data) return;
    window.scheduleMatches = data.matches;
    renderScheduleList(defaultView);
}

window.switchScheduleTab = function (type) {
    // Navigate between separate files
    if (type === 'results' && !window.location.pathname.includes('results')) {
        if (window.barcaRouter) {
            window.barcaRouter.navigate('results.html');
        } else {
            window.location.href = 'results.html';
        }
        return;
    }
    if (type === 'upcoming' && window.location.pathname.includes('results')) {
        if (window.barcaRouter) {
            window.barcaRouter.navigate('schedule.html');
        } else {
            window.location.href = 'schedule.html';
        }
        return;
    }


    // Toggle internally if on the same page (fallback)
    document.querySelectorAll('.pill-toggle .option').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${type}`).classList.add('active');
    renderScheduleList(type);
};


function renderScheduleList(type) {
    const matches = window.scheduleMatches;
    const today = new Date();
    let filtered = [];

    // Sort logic
    if (type === 'upcoming') {
        filtered = matches.filter(m => new Date(m.utcDate) >= today);
    } else {
        // Results: Newest first (Descending)
        filtered = matches.filter(m => new Date(m.utcDate) < today).sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));
    }

    const container = document.getElementById('schedule-list');

    if (filtered.length === 0) {
        container.innerHTML = `<div class="p-8 text-center opacity-50 glass-premium">No matches found.</div>`;
        return;
    }

    container.innerHTML = filtered.map((m, idx) => {
        const isHome = m.homeTeam.id === BARCA_ID;
        const opponent = isHome ? m.awayTeam : m.homeTeam;
        const date = new Date(m.utcDate);
        const isResult = type === 'results';

        // Only show time for the first 3 matches in upcoming list
        const showTime = idx < 3 || isResult;
        const utcH = date.getUTCHours();
        const isTbd = m.status === 'SCHEDULED' && (utcH === 0 || utcH === 1 || utcH === 2);
        const timeValue = isTbd ? t('tbd') : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const timeDisplay = showTime ? ` • ${timeValue}` : "";


        return `
            <div class="glass-premium p-5 mb-4 flex items-center gap-4 animate-in"
                 style="animation-delay: ${idx * 50}ms; border-radius: 28px;">
                
                <!-- iOS Notification Icon Style -->
                <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                    <img src="${getTeamCrest(opponent.name || opponent.shortName, opponent.crest)}" data-name="${opponent.name || opponent.shortName}" class="w-8 h-8 object-contain" loading="lazy" referrerpolicy="no-referrer" onerror="handleLogoError(this)">
                </div>

                
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-start mb-0.5">
                        <h4 class="font-bold text-sm truncate flex items-center gap-1.5">
                            vs ${opponent.shortName}
                        </h4>
                        <span class="text-[9px] font-black opacity-40 uppercase tracking-widest text-right">
                            ${m.competition.name || m.competition.code}
                            ${(() => {
                if (m.currentRound) {
                    const isNumeric = /^\d+$/.test(String(m.currentRound));
                    return `<br><span class="opacity-60">${isNumeric ? 'Kolejka ' + m.currentRound : m.currentRound}</span>`;
                } else if (m.displayName) {
                    return `<br><span class="opacity-60">${m.displayName}</span>`;
                }
                return '';
            })()}
                        </span>
                    </div>
                    <p class="text-xs text-secondary font-medium">${I18n.formatDate(date, { weekday: 'long', month: 'short', day: 'numeric' })}${timeDisplay}</p>
                </div>
                
                <div class="flex flex-col items-end gap-1">
                    ${isResult ?
                `<span class="font-black text-lg tracking-tighter">${m.score.fullTime.home}-${m.score.fullTime.away}</span>` :
                `<div class="w-2 h-2 rounded-full bg-gold"></div>`
            }
                </div>
            </div>
        `;
    }).join('');
}


// --- WHERE TO WATCH / TRANSMISSIONS ---
async function initWhereToWatch() {
    const container = document.getElementById('transmissions-container');
    if (!container) return;

    try {
        const res = await window.barcaAPI.fetchAllData();
        if (res.success) {
            // Prioritize live match, then upcoming
            const liveMatch = res.data.matches.live?.[0];
            const upcomingMatch = res.data.matches.upcoming?.[0];
            const matchToShow = liveMatch || upcomingMatch;

            const channels = matchToShow?.tvChannels || [];
            renderTransmissions(channels);
        } else {
            renderTransmissions([]);
        }
    } catch (e) {
        console.error("Transmission error:", e);
        renderTransmissions([]);
    }
}

function renderTransmissions(channels) {
    const container = document.getElementById('transmissions-container');
    if (!container) return;

    if (!channels || channels.length === 0) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center w-full h-full min-h-[220px] text-center opacity-40">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                </svg>
                <span class="text-xs font-bold uppercase tracking-widest px-4">Brak informacji o transmisji</span>
            </div>`;
        return;
    }

    container.innerHTML = channels.map(channel => {
        const filename = CHANNEL_LOGO_MAP[channel];
        let logoUrl = null;
        if (filename) logoUrl = `${LOGO_BASE_URL}/channel/${filename}`;

        // Dynamic gradient based on channel name hash
        const hash = channel.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const hue = hash % 360;
        const gradientStyle = `background: linear-gradient(135deg, hsla(${hue}, 70%, 20%, 0.9) 0%, hsla(${hue}, 70%, 10%, 0.95) 100%); border: 1px solid hsla(${hue}, 50%, 40%, 0.3);`;

        return `
            <div class="group relative flex items-center gap-4 p-4 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden" 
                 style="${gradientStyle} box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                
                <div class="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div class="shrink-0">
                     ${logoUrl
                ? `<img src="${logoUrl}" alt="${channel}" class="w-12 h-12 object-contain filter drop-shadow-lg">`
                : `<div class="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center border border-white/5"><span class="text-[10px] font-bold text-white/80 leading-tight text-center">${channel.substring(0, 3)}</span></div>`
            }
                </div>
                
                <div class="flex flex-col min-w-0">
                    <span class="text-sm font-bold text-white tracking-wide truncate">${channel}</span>
                    <span class="text-[9px] font-medium text-white/50 uppercase tracking-wider">Transmisja</span>
                </div>
            </div>
        `;
    }).join('');
}

