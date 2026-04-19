// chickenroad.js
class ChickenRoadGame {
  constructor(container, opts) {
    this.el = container;
    this.mult = opts.mult || 1;
    this.onWin = opts.onWin || function(){};
    this.onLose = opts.onLose || function(){};
    this.bet = 100;
    this.pos = 0;        // current oven index (0 = start, not yet jumped)
    this.maxOvens = 10;
    this.ovens = [];     // true = safe, false = burn
    this.active = false;
    this.MULTS = [1.2,1.5,2.0,2.8,4.0,5.5,8.0,12.0,18.0,28.0];
    this.render();
  }

  buildOvens() {
    // First 2 always safe to give player a chance, rest weighted
    this.ovens = Array.from({length: this.maxOvens}, (_, i) => {
      if (i < 2) return true;
      const burnChance = 0.2 + i * 0.05; // gets harder
      return Math.random() > burnChance;
    });
  }

  startGame() {
    if (this.bet > Store.getCoins()) { toast('Nicht genug Coins!', 'error'); return; }
    Store.addCoins(-this.bet);
    Store.addStat('totalLost', this.bet);
    Store.updateNavCoins();
    this.buildOvens();
    this.pos = 0;
    this.active = true;
    this.renderBoard();
  }

  jump() {
    if (!this.active) return;
    const nextPos = this.pos; // jumping onto oven this.pos (0-indexed)
    if (nextPos >= this.maxOvens) { this.cashout(); return; }

    if (this.ovens[nextPos]) {
      this.pos++;
      if (this.pos >= this.maxOvens) {
        // Completed all ovens!
        this.active = false;
        const won = Math.round(this.bet * this.MULTS[this.maxOvens - 1]);
        this.onWin(won);
        toast(`🏆 ALLE ÖFEN! +${Store.fmt(won)} Coins!`, 'success');
        this.renderBoard(false, true);
      } else {
        this.renderBoard();
      }
    } else {
      // Burned!
      this.active = false;
      this.onLose(0);
      this.renderBoard(true);
      toast('🔥 VERBRANNT! Verloren.', 'error');
    }
  }

  cashout() {
    if (!this.active || this.pos === 0) return;
    this.active = false;
    const won = Math.round(this.bet * this.MULTS[this.pos - 1]);
    this.onWin(won);
    this.renderBoard(false, true);
    toast(`🐔 Cashout! +${Store.fmt(won)} Coins`, 'success');
  }

  renderBoard(burned = false, won = false) {
    const board = this.el.querySelector('#cr-board');
    if (!board) return;

    const currentMult = this.pos > 0 ? this.MULTS[this.pos - 1] : 1;
    const pot = Math.round(this.bet * currentMult);

    board.innerHTML = `
      <div style="display:flex;align-items:flex-end;gap:.4rem;overflow-x:auto;padding:.5rem 0;justify-content:center;flex-wrap:wrap;">
        <!-- Chicken start -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:.3rem;flex-shrink:0;">
          <div style="font-size:2rem;">${this.pos === 0 && this.active ? '🐔' : '🟫'}</div>
          <div style="font-size:.6rem;color:rgba(255,255,255,.3);letter-spacing:.1em;">START</div>
        </div>
        ${Array.from({length: this.maxOvens}, (_, i) => {
          const isPast = i < this.pos;
          const isCurrent = i === this.pos - 1 && !this.active && won;
          const isBurned = burned && i === this.pos && !this.ovens[i];
          const isNext = i === this.pos && this.active;
          const show = isPast || burned || won;

          let icon = '🟫';
          let bg = 'rgba(255,255,255,.05)';
          let border = '1px solid rgba(255,255,255,.08)';

          if (isPast) {
            icon = this.ovens[i] ? '✅' : '💀';
            bg = 'rgba(48,224,128,.1)';
            border = '1px solid var(--green)';
          } else if (isBurned) {
            icon = '💀';
            bg = 'rgba(224,48,48,.2)';
            border = '1px solid var(--red)';
          } else if (isNext) {
            icon = '🔥';
            bg = 'rgba(255,128,0,.1)';
            border = '1px solid var(--orange)';
          } else if (show) {
            icon = this.ovens[i] ? '🟩' : '💀';
          }

          const multLabel = this.MULTS[i];

          return `
            <div style="display:flex;flex-direction:column;align-items:center;gap:.3rem;flex-shrink:0;">
              <div style="font-size:.65rem;font-family:'Bebas Neue',sans-serif;color:${isPast?'var(--green)':'rgba(255,255,255,.3)'};">×${multLabel}</div>
              <div style="width:56px;height:56px;border-radius:6px;background:${bg};border:${border};display:flex;align-items:center;justify-content:center;font-size:1.5rem;">
                ${isNext && this.active ? '🔥' : (show ? icon : '🍳')}
              </div>
              <div style="font-size:.6rem;color:rgba(255,255,255,.25);">Ofen ${i+1}</div>
            </div>`;
        }).join('')}
        <!-- Finish -->
        <div style="display:flex;flex-direction:column;align-items:center;gap:.3rem;flex-shrink:0;">
          <div style="font-size:2rem;">🏆</div>
          <div style="font-size:.6rem;color:var(--gold);letter-spacing:.1em;">ZIEL</div>
        </div>
      </div>

      <!-- Chicken position indicator -->
      ${this.active && this.pos > 0 ? `<div style="text-align:center;font-size:2rem;margin:.5rem 0;">🐔</div>` : ''}
      ${burned ? `<div style="text-align:center;font-size:2rem;margin:.5rem 0;">💀🐔</div>` : ''}
      ${won && !this.active ? `<div style="text-align:center;font-size:2rem;margin:.5rem 0;">🐔🏆</div>` : ''}

      <div style="text-align:center;margin-top:.8rem;display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap;align-items:center;">
        ${this.active ? `
          <button class="btn btn-orange" onclick="crGame.jump()" style="font-size:1.1rem;background:var(--orange);color:#000;">🐔 SPRINGEN</button>
          ${this.pos > 0 ? `<button class="btn btn-green" onclick="crGame.cashout()">CASHOUT ×${currentMult} = ${Store.fmt(pot)}</button>` : ''}
        ` : `
          <button class="btn btn-gold" onclick="crGame.startGame()">NEU SPIELEN</button>
        `}
        <div style="font-family:'Bebas Neue',sans-serif;font-size:1rem;color:rgba(255,255,255,.4);">
          Ofen ${this.pos}/${this.maxOvens} · Mult: <span style="color:var(--gold)">×${currentMult}</span>
        </div>
      </div>`;

    Store.updateNavCoins();
  }

  render() {
    this.el.innerHTML = `
    <div style="width:min(96vw,680px);">
      <div class="card" style="margin-bottom:1rem;">
        <div style="display:flex;gap:.8rem;align-items:flex-end;flex-wrap:wrap;">
          <div>
            <label style="font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.4);display:block;margin-bottom:.4rem;">EINSATZ</label>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
              ${[50,100,250,500,1000].map(v=>`<button class="btn btn-ghost" style="font-size:.8rem;padding:.3em .7em;" onclick="crGame.bet=${v}">${Store.fmt(v)}</button>`).join('')}
              <input type="number" value="100" min="1" style="width:90px;background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:.4em .7em;color:var(--text);font-family:'Rajdhani',sans-serif;font-size:.95rem;" oninput="crGame.bet=+this.value||1"/>
            </div>
          </div>
          <button class="btn btn-gold" onclick="crGame.startGame()">🐔 STARTEN</button>
        </div>
        <div style="margin-top:.6rem;font-size:.8rem;color:rgba(255,255,255,.3);">
          Springe von Ofen zu Ofen. Je weiter, desto mehr Coins. Cashout bevor du verbrennst!
        </div>
      </div>
      <div id="cr-board"></div>
    </div>`;
    window.crGame = this;
    this.renderBoard();
  }

  destroy() {}
}
