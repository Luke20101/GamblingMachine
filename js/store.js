// ═══════════════════════════════════════════
// store.js  —  Zentrale Datenverwaltung
// Speichert alles in localStorage
// ═══════════════════════════════════════════

const Store = (() => {

  // Schlüssel
  const K = {
    users:    'vault_users',
    session:  'vault_session',
    mults:    'vault_multipliers',
  };

  // ── Benutzer laden ──
  function getUsers() {
    return JSON.parse(localStorage.getItem(K.users) || '{}');
  }
  function saveUsers(u) {
    localStorage.setItem(K.users, JSON.stringify(u));
  }

  // ── Session ──
  function getSession() {
    return JSON.parse(localStorage.getItem(K.session) || 'null');
  }
  function setSession(username) {
    localStorage.setItem(K.session, JSON.stringify({ username, ts: Date.now() }));
  }
  function clearSession() {
    localStorage.removeItem(K.session);
    localStorage.removeItem(K.mults);
  }

  // ── Aktueller User ──
  function currentUser() {
    const s = getSession();
    if (!s) return null;
    const users = getUsers();
    return users[s.username] || null;
  }
  function currentUsername() {
    const s = getSession();
    return s ? s.username : null;
  }

  // ── User speichern ──
  function saveUser(user) {
    const users = getUsers();
    users[user.username] = user;
    saveUsers(users);
  }

  // ── Register ──
  function register(username, password) {
    const users = getUsers();
    if (users[username]) return { ok: false, msg: 'Benutzername bereits vergeben.' };
    if (username.length < 3) return { ok: false, msg: 'Benutzername zu kurz (min. 3 Zeichen).' };
    if (password.length < 4) return { ok: false, msg: 'Passwort zu kurz (min. 4 Zeichen).' };
    const newUser = {
      username,
      password,
      coins: 0,         // wird nach Gamble gesetzt
      registered: Date.now(),
      stats: {
        gamesPlayed: 0,
        totalWon: 0,
        totalLost: 0,
        casesOpened: 0,
        highscores: {},
      },
      bank: {
        loan: 0,
        loanDue: 0,
        interest: 0.1,
      },
      firstLogin: true,
    };
    users[username] = newUser;
    saveUsers(users);
    setSession(username);
    return { ok: true };
  }

  // ── Login ──
  function login(username, password) {
    const users = getUsers();
    const u = users[username];
    if (!u) return { ok: false, msg: 'Benutzer nicht gefunden.' };
    if (u.password !== password) return { ok: false, msg: 'Falsches Passwort.' };
    setSession(username);
    return { ok: true, firstLogin: u.firstLogin };
  }

  // ── Coins ──
  function getCoins() {
    const u = currentUser();
    return u ? u.coins : 0;
  }
  function addCoins(amount) {
    const u = currentUser();
    if (!u) return;
    u.coins = Math.max(0, (u.coins || 0) + amount);
    saveUser(u);
    updateNavCoins();
  }
  function setCoins(amount) {
    const u = currentUser();
    if (!u) return;
    u.coins = Math.max(0, amount);
    saveUser(u);
    updateNavCoins();
  }
  function setFirstLoginDone() {
    const u = currentUser();
    if (!u) return;
    u.firstLogin = false;
    saveUser(u);
  }

  // ── Stats ──
  function addStat(key, value = 1) {
    const u = currentUser();
    if (!u) return;
    u.stats[key] = (u.stats[key] || 0) + value;
    saveUser(u);
  }
  function setHighscore(game, score) {
    const u = currentUser();
    if (!u) return;
    if (!u.stats.highscores) u.stats.highscores = {};
    if ((u.stats.highscores[game] || 0) < score) {
      u.stats.highscores[game] = score;
      saveUser(u);
    }
  }

  // ── Bank ──
  function getBank() {
    const u = currentUser();
    return u ? u.bank : { loan: 0, loanDue: 0, interest: 0.1 };
  }
  function takeLoan(amount, interestRate) {
    const u = currentUser();
    if (!u) return { ok: false, msg: 'Nicht eingeloggt.' };
    if (u.bank.loan > 0) return { ok: false, msg: 'Bereits ein offener Kredit.' };
    const total = Math.round(amount * (1 + interestRate));
    u.bank.loan = total;
    u.bank.loanDue = Date.now() + 10 * 60 * 1000; // 10 Minuten
    u.bank.originalAmount = amount;
    u.coins += amount;
    saveUser(u);
    updateNavCoins();
    return { ok: true, total };
  }
  function repayLoan() {
    const u = currentUser();
    if (!u || u.bank.loan <= 0) return { ok: false, msg: 'Kein offener Kredit.' };
    if (u.coins < u.bank.loan) return { ok: false, msg: 'Nicht genug Coins.' };
    u.coins -= u.bank.loan;
    u.bank.loan = 0;
    u.bank.loanDue = 0;
    saveUser(u);
    updateNavCoins();
    return { ok: true };
  }
  function checkLoanOverdue() {
    const u = currentUser();
    if (!u || u.bank.loan <= 0) return;
    if (Date.now() > u.bank.loanDue) {
      // Strafzins: 50% extra
      const penalty = Math.round(u.bank.loan * 0.5);
      u.bank.loan += penalty;
      u.bank.loanDue = Date.now() + 5 * 60 * 1000; // 5 min Verlängerung
      saveUser(u);
      toast(`⚠️ Kredit überfällig! Strafgebühr: +${penalty} Coins`, 'error');
    }
  }

  // ══════════════════════════════
  // MULTIPLIER SYSTEM
  // ══════════════════════════════
  const MULT_DURATION = 10 * 60 * 1000; // 10 Minuten

  function getMults() {
    const raw = localStorage.getItem(K.mults);
    if (!raw) return null;
    const m = JSON.parse(raw);
    if (Date.now() > m.expires) {
      localStorage.removeItem(K.mults);
      return null;
    }
    return m;
  }

  function setMults(values) {
    const m = {
      ...values,
      expires: Date.now() + MULT_DURATION,
      set: Date.now(),
    };
    localStorage.setItem(K.mults, JSON.stringify(m));
    return m;
  }

  function getMultRemaining() {
    const m = getMults();
    if (!m) return 0;
    return Math.max(0, m.expires - Date.now());
  }

  // Multiplier-Typen:
  // games: Gewinn-Multiplikator für Arcade Games
  // gamble: Einsatz-Multiplikator für Gambling
  // case: Kosten-Faktor für Cases (< 1 = günstiger, > 1 = teurer)
  // bank: Zinssatz-Multiplikator

  function getGameMult()   { const m = getMults(); return m ? m.games  : 1; }
  function getGambleMult() { const m = getMults(); return m ? m.gamble : 1; }
  function getCaseMult()   { const m = getMults(); return m ? m.caseM  : 1; }
  function getBankMult()   { const m = getMults(); return m ? m.bank   : 1; }

  // ══════════════════════════════
  // UI HELPERS
  // ══════════════════════════════
  function updateNavCoins() {
    const el = document.getElementById('navCoins');
    if (el) el.textContent = fmt(getCoins());
  }
  function fmt(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return Math.floor(n).toLocaleString('de-DE');
  }

  // Redirect wenn nicht eingeloggt
  function requireAuth() {
    if (!getSession()) {
      window.location.href = 'index.html';
      return false;
    }
    checkLoanOverdue();
    return true;
  }

  return {
    register, login, logout: clearSession,
    currentUser, currentUsername,
    getCoins, addCoins, setCoins, setFirstLoginDone,
    addStat, setHighscore,
    getBank, takeLoan, repayLoan, checkLoanOverdue,
    getMults, setMults, getMultRemaining,
    getGameMult, getGambleMult, getCaseMult, getBankMult,
    updateNavCoins, fmt, requireAuth,
  };
})();

// ── TOAST ──
function toast(msg, type = 'info', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// ── PARTICLES ──
function spawnParticles(cx, cy, colors, n = 24) {
  colors = colors || ['#f0c040','#ffd700','#fff','#9040ff','#e03030'];
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const a = (Math.PI*2/n)*i + Math.random()*.6, d = 60+Math.random()*120;
    p.style.cssText = `left:${cx}px;top:${cy}px;background:${colors[Math.floor(Math.random()*colors.length)]};--tx:${Math.cos(a)*d}px;--ty:${Math.sin(a)*d-50}px;--d:${0.5+Math.random()*0.7}s;width:${3+Math.random()*7}px;height:${3+Math.random()*7}px;`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1100);
  }
}
