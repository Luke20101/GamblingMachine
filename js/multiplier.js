// ═══════════════════════════════════════════
// multiplier.js  —  Multiplier Case Spin
// ═══════════════════════════════════════════

const MultSystem = (() => {

  // Mögliche Multiplier-Werte pro Kategorie
  const TABLES = {
    games:  [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 5.0, 10.0],
    gamble: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 5.0, 10.0],
    caseM:  [0.5, 0.6,  0.75, 0.9, 1.0, 1.1, 1.25, 1.5, 2.0, 0.25],
    bank:   [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 0.1, 4.0, 5.0],
  };

  // Gewichte (höhere Zahl = häufiger)
  const WEIGHTS = [15, 15, 20, 15, 12, 10, 6, 4, 2, 1];

  function weightedRandom(arr) {
    const total = WEIGHTS.reduce((a,b) => a+b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < arr.length; i++) {
      r -= WEIGHTS[i];
      if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
  }

  function rollMultipliers() {
    return {
      games:  weightedRandom(TABLES.games),
      gamble: weightedRandom(TABLES.gamble),
      caseM:  weightedRandom(TABLES.caseM),
      bank:   weightedRandom(TABLES.bank),
    };
  }

  // Reel-Pool für Animation
  const REEL_POOL = [
    {i:'⚡',l:'BOOST', r:'gold'},
    {i:'💎',l:'ULTRA', r:'purple'},
    {i:'🎯',l:'PRÄZIS',r:'blue'},
    {i:'🔥',l:'HEISS',  r:'red'},
    {i:'❄️',l:'KALT',  r:'blue'},
    {i:'⭐',l:'STAR',  r:'gold'},
    {i:'💀',l:'RISIKO',r:'red'},
    {i:'🌈',l:'LUCK',  r:'purple'},
    {i:'🚀',l:'MEGA',  r:'gold'},
    {i:'💸',l:'PROFIT',r:'green'},
    {i:'🎲',l:'RANDOM',r:'red'},
    {i:'👑',l:'ROYAL', r:'gold'},
  ];

  function buildReel(track, winIcon, winLabel, winRarity) {
    track.innerHTML = '';
    const big = [];
    for (let i = 0; i < 60; i++) big.push(REEL_POOL[Math.floor(Math.random() * REEL_POOL.length)]);
    big[44] = {i: winIcon, l: winLabel, r: winRarity};
    big.forEach(item => {
      const el = document.createElement('div');
      el.className = `reel-item r-${item.r}`;
      el.innerHTML = `${item.i}<span>${item.l}</span>`;
      track.appendChild(el);
    });
  }

  function spinReel(track, reelWrap, onDone) {
    const ITEM_W = 100;
    const cw = reelWrap.offsetWidth;
    const center = cw / 2 - ITEM_W / 2;
    const targetX = -(44 * ITEM_W - center);
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    track.getBoundingClientRect();
    track.style.transition = 'transform 3.6s cubic-bezier(0.04,.5,.12,1)';
    track.style.transform = `translateX(${targetX}px)`;
    setTimeout(() => {
      const flash = document.createElement('div');
      flash.className = 'win-flash';
      reelWrap.appendChild(flash);
      setTimeout(() => flash.remove(), 1200);
      if (onDone) onDone();
    }, 3700);
  }

  // Zeigt das 4-Reel Modal zum Spin aller Multiplier
  function openMultModal(onComplete) {
    const existing = document.getElementById('mult-modal-overlay');
    if (existing) existing.remove();

    const values = rollMultipliers();
    const cats = [
      { key: 'games',  label: 'GAMES MULT',  icon: '🎮', desc: 'Spielgewinne' },
      { key: 'gamble', label: 'GAMBLE MULT', icon: '🎰', desc: 'Einsatz-Faktor' },
      { key: 'caseM',  label: 'CASE KOSTEN', icon: '📦', desc: 'Kosten-Faktor' },
      { key: 'bank',   label: 'BANK ZINS',   icon: '🏦', desc: 'Zinssatz-Faktor' },
    ];

    const overlay = document.createElement('div');
    overlay.id = 'mult-modal-overlay';
    overlay.className = 'modal-overlay open';
    overlay.style.cssText = 'z-index:600;';
    overlay.innerHTML = `
      <div class="modal-box" style="width:min(96vw,700px);max-height:90vh;overflow-y:auto;">
        <div class="modal-title">🎲 MULTIPLIER GAMBLE</div>
        <p style="color:rgba(255,255,255,.5);font-size:.9rem;margin-bottom:1.5rem;line-height:1.6;">
          Spin die Reels um deine Multiplier für die nächsten <strong style="color:var(--gold)">10 Minuten</strong> zu bestimmen!
        </p>
        <div id="mult-reels" style="display:flex;flex-direction:column;gap:1rem;"></div>
        <div id="mult-results" style="display:none;margin-top:1.5rem;"></div>
        <div class="modal-actions" id="mult-actions">
          <button class="btn btn-gold" id="spinAllBtn">ALLE SPINNEN</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const reelsContainer = overlay.querySelector('#mult-reels');
    const reelEls = [];

    cats.forEach((cat, i) => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;align-items:center;gap:1rem;';
      wrap.innerHTML = `
        <div style="width:130px;flex-shrink:0;">
          <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:.15em;color:var(--gold)">${cat.icon} ${cat.label}</div>
          <div style="font-size:.7rem;color:rgba(255,255,255,.35);letter-spacing:.1em">${cat.desc}</div>
        </div>
        <div class="reel-wrap" style="flex:1;height:70px;" id="reel-${i}">
          <div class="reel-track" id="track-${i}"></div>
        </div>
        <div id="result-${i}" style="width:70px;text-align:center;font-family:'Bebas Neue',sans-serif;font-size:1.3rem;color:var(--gold);opacity:0;transition:opacity .3s;">×${values[cat.key]}</div>`;
      reelsContainer.appendChild(wrap);
      reelEls.push({ reel: wrap.querySelector(`#reel-${i}`), track: wrap.querySelector(`#track-${i}`), result: wrap.querySelector(`#result-${i}`), cat, value: values[cat.key] });
    });

    // Build reels
    reelEls.forEach(r => {
      const rarity = r.value >= 3 ? 'gold' : r.value >= 2 ? 'purple' : r.value >= 1 ? 'blue' : 'red';
      buildReel(r.track, r.cat.icon, `×${r.value}`, rarity);
    });

    let spun = false;
    overlay.querySelector('#spinAllBtn').addEventListener('click', () => {
      if (spun) return;
      spun = true;
      overlay.querySelector('#spinAllBtn').disabled = true;

      let done = 0;
      reelEls.forEach((r, i) => {
        setTimeout(() => {
          spinReel(r.track, r.reel, () => {
            r.result.style.opacity = '1';
            done++;
            if (done === reelEls.length) {
              // Save multipliers
              Store.setMults(values);
              // Show confirm button
              const actions = overlay.querySelector('#mult-actions');
              actions.innerHTML = '<button class="btn btn-gold" id="multConfirm">BESTÄTIGEN ✓</button>';
              overlay.querySelector('#multConfirm').addEventListener('click', () => {
                overlay.remove();
                if (onComplete) onComplete(values);
              });
            }
          });
        }, i * 400); // staggered start
      });
    });
  }

  return { openMultModal, rollMultipliers, getMults: Store.getMults };
})();
