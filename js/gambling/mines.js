// mines.js
class MinesGame {
  constructor(container, opts) {
    this.el = container;
    this.mult = opts.mult || 1;
    this.onWin = opts.onWin || function(){};
    this.onLose = opts.onLose || function(){};
    this.bet = 100;
    this.mineCount = 3;
    this.grid = [];
    this.revealed = [];
    this.mines = new Set();
    this.active = false;
    this.cashoutMult = 1;
    this.safeClicks = 0;
    this.render();
  }

  calcMult() {
    const total = 25, safe = total - this.mineCount;
    let m = 1;
    for (let i = 0; i < this.safeClicks; i++) {
      m *= (safe - i) / (total - this.mineCount - i);
    }
    return Math.max(1, (1 / m) * 0.97);
  }

  startGame() {
    const coins = Store.getCoins();
    if (this.bet > coins) { toast('Nicht genug Coins!', 'error'); return; }
    Store.addCoins(-this.bet);
    Store.addStat('totalLost', this.bet);
    Store.updateNavCoins();

    this.mines = new Set();
    this.revealed = Array(25).fill(false);
    this.safeClicks = 0;
    while (this.mines.size < this.mineCount) this.mines.add(Math.floor(Math.random()*25));
    this.active = true;
    this.renderGrid();
    this.updateUI();
  }

  reveal(i) {
    if (!this.active || this.revealed[i]) return;
    this.revealed[i] = true;
    if (this.mines.has(i)) {
      // BOOM
      this.active = false;
      this.onLose(0);
      this.renderGrid(true);
      toast('💥 BOOM! Alle Mines aufgedeckt.', 'error');
    } else {
      this.safeClicks++;
      this.cashoutMult = this.calcMult();
      this.renderGrid();
      this.updateUI();
    }
  }

  cashout() {
    if (!this.active || this.safeClicks === 0) return;
    this.active = false;
    const won = Math.round(this.bet * this.cashoutMult);
    this.onWin(won);
    this.renderGrid(false, true);
    toast(`💰 Cashout: ${Store.fmt(won)} Coins!`, 'success');
  }

  renderGrid(showAll = false, won = false) {
    const gridEl = this.el.querySelector('#mines-grid');
    if (!gridEl) return;
    gridEl.innerHTML = '';
    for (let i = 0; i < 25; i++) {
      const cell = document.createElement('div');
      cell.style.cssText = `width:64px;height:64px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.8rem;cursor:pointer;transition:transform .15s,background .2s;border:1px solid rgba(255,255,255,.08);`;
      if (this.revealed[i]) {
        if (this.mines.has(i)) {
          cell.style.background = '#3a0808';
          cell.textContent = '💣';
        } else {
          cell.style.background = 'rgba(48,224,128,.15)';
          cell.textContent = '💎';
        }
      } else if ((showAll || won) && this.mines.has(i)) {
        cell.style.background = '#2a0606';
        cell.textContent = '💣';
        cell.style.opacity = '.6';
      } else {
        cell.style.background = 'rgba(255,255,255,.05)';
        cell.textContent = won ? '⬜' : '❓';
        if (this.active) {
          cell.addEventListener('click', () => this.reveal(i));
          cell.addEventListener('mouseenter', () => cell.style.transform = 'scale(1.08)');
          cell.addEventListener('mouseleave', () => cell.style.transform = '');
        }
      }
      gridEl.appendChild(cell);
    }
    Store.updateNavCoins();
  }

  updateUI() {
    const co = this.el.querySelector('#mines-cashout');
    const mp = this.el.querySelector('#mines-mult');
    const pot = this.el.querySelector('#mines-pot');
    if (co) co.disabled = !this.active || this.safeClicks === 0;
    if (mp) mp.textContent = '×'+this.cashoutMult.toFixed(2);
    if (pot) pot.textContent = Store.fmt(Math.round(this.bet * this.cashoutMult));
  }

  render() {
    this.el.innerHTML = `
    <div style="width:min(96vw,520px);">
      <div class="card" style="margin-bottom:1rem;">
        <div style="display:flex;gap:1rem;flex-wrap:wrap;align-items:flex-end;">
          <div>
            <label style="font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.4);display:block;margin-bottom:.4rem;">EINSATZ</label>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
              ${[50,100,250,500,1000].map(v=>`<button class="btn btn-ghost" style="font-size:.8rem;padding:.3em .8em;" onclick="this.closest('[id]')&&0;document.querySelector('#mines-bet').value=${v};minesGame.bet=${v};">${Store.fmt(v)}</button>`).join('')}
              <input id="mines-bet" type="number" value="100" min="1" style="width:90px;background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:.4em .7em;color:var(--text);font-family:'Rajdhani',sans-serif;font-size:.95rem;" oninput="minesGame.bet=+this.value||1"/>
            </div>
          </div>
          <div>
            <label style="font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.4);display:block;margin-bottom:.4rem;">BOMBEN</label>
            <div style="display:flex;gap:.5rem;">
              ${[1,3,5,10,15,20].map(v=>`<button class="btn btn-ghost" style="font-size:.8rem;padding:.3em .7em;" onclick="minesGame.mineCount=${v};minesGame.render();">${v}</button>`).join('')}
            </div>
          </div>
        </div>
        <div style="margin-top:1rem;display:flex;gap:.8rem;align-items:center;flex-wrap:wrap;">
          <button class="btn btn-gold" onclick="minesGame.startGame()" style="font-size:1rem;">SPIELEN (${this.mineCount} 💣)</button>
          <button class="btn btn-green" id="mines-cashout" disabled onclick="minesGame.cashout()" style="font-size:1rem;">CASHOUT ×<span id="mines-mult">1.00</span></button>
          <div style="margin-left:auto;font-family:'Bebas Neue',sans-serif;font-size:1.2rem;color:var(--gold);">POT: <span id="mines-pot">0</span> 💰</div>
        </div>
      </div>
      <div id="mines-grid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:.5rem;"></div>
    </div>`;
    window.minesGame = this;
    this.renderGrid();
  }

  destroy() {}
}
