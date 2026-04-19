// roulette.js
class RouletteGame {
  constructor(container, opts) {
    this.el = container;
    this.mult = opts.mult || 1;
    this.onWin = opts.onWin || function(){};
    this.onLose = opts.onLose || function(){};
    this.bet = 100;
    this.bets = {}; // {type: amount}
    this.lastResult = null;
    this.spinning = false;
    this.REDS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
    this.render();
  }

  getColor(n) {
    if (n === 0) return 'green';
    return this.REDS.has(n) ? 'red' : 'black';
  }

  placeBet(type, amount) {
    if (this.spinning) return;
    const total = Object.values(this.bets).reduce((a,b)=>a+b,0);
    if (total + amount > Store.getCoins()) { toast('Nicht genug Coins!','error'); return; }
    this.bets[type] = (this.bets[type] || 0) + amount;
    this.updateBetDisplay();
  }

  clearBets() { this.bets = {}; this.updateBetDisplay(); }

  spin() {
    if (this.spinning || Object.keys(this.bets).length === 0) { toast('Platziere zuerst Einsätze!','error'); return; }
    const totalBet = Object.values(this.bets).reduce((a,b)=>a+b,0);
    if (totalBet > Store.getCoins()) { toast('Nicht genug Coins!','error'); return; }

    Store.addCoins(-totalBet);
    Store.addStat('totalLost', totalBet);
    Store.updateNavCoins();
    this.spinning = true;

    const result = Math.floor(Math.random() * 37); // 0-36
    this.lastResult = result;
    const color = this.getColor(result);

    // Animate wheel
    const wheelEl = this.el.querySelector('#roulette-wheel');
    if (wheelEl) {
      wheelEl.style.transition = 'transform 3s cubic-bezier(.4,0,.15,1)';
      const deg = 1440 + (result / 37) * 360;
      wheelEl.style.transform = `rotate(${deg}deg)`;
    }

    setTimeout(() => {
      this.spinning = false;
      let totalWon = 0;

      Object.entries(this.bets).forEach(([type, amount]) => {
        let payout = 0;
        if (type === 'red'   && color === 'red')   payout = amount * 2;
        if (type === 'black' && color === 'black') payout = amount * 2;
        if (type === 'even'  && result > 0 && result % 2 === 0) payout = amount * 2;
        if (type === 'odd'   && result % 2 === 1)  payout = amount * 2;
        if (type === '1-18'  && result >= 1 && result <= 18)  payout = amount * 2;
        if (type === '19-36' && result >= 19 && result <= 36) payout = amount * 2;
        if (type === '1-12'  && result >= 1 && result <= 12)  payout = amount * 3;
        if (type === '13-24' && result >= 13 && result <= 24) payout = amount * 3;
        if (type === '25-36' && result >= 25 && result <= 36) payout = amount * 3;
        if (type === 'num-'+result) payout = amount * 36;
        totalWon += payout;
      });

      const resultEl = this.el.querySelector('#roulette-result');
      if (resultEl) {
        const colMap = {red:'#e03030',black:'#fff',green:'#30e080'};
        resultEl.innerHTML = `<span style="font-size:2rem;color:${colMap[color]}">${result}</span> <span style="color:${colMap[color]}">${color.toUpperCase()}</span>`;
      }

      if (totalWon > 0) {
        this.onWin(totalWon);
        toast(`🎡 ${result} ${color.toUpperCase()}! +${Store.fmt(totalWon)} Coins`,'success');
      } else {
        toast(`🎡 ${result} ${color.toUpperCase()} — Verloren`,'error');
      }

      this.bets = {};
      this.updateBetDisplay();
    }, 3200);
  }

  updateBetDisplay() {
    const total = Object.values(this.bets).reduce((a,b)=>a+b,0);
    const el = this.el.querySelector('#bet-total');
    if (el) el.textContent = Store.fmt(total);
    // Update individual bet labels
    Object.keys(this.bets).forEach(type => {
      const el = this.el.querySelector(`.bet-chip[data-type="${type}"]`);
      if (el) el.textContent = Store.fmt(this.bets[type]);
    });
  }

  render() {
    const NUMBERS = Array.from({length:37},(_,i)=>i);
    this.el.innerHTML = `
    <div style="width:min(96vw,640px);">
      <!-- Wheel -->
      <div style="display:flex;justify-content:center;margin-bottom:1.5rem;position:relative;">
        <div style="width:160px;height:160px;border-radius:50%;border:4px solid var(--gold);position:relative;overflow:hidden;box-shadow:0 0 40px rgba(240,192,64,.3);">
          <div id="roulette-wheel" style="width:100%;height:100%;border-radius:50%;background:conic-gradient(
            ${NUMBERS.map(n=>{const c=this.getColor(n);const col=c==='red'?'#c02020':c==='black'?'#1a1a1a':'#186030';return `${col} ${(n/37)*360}deg ${((n+1)/37)*360}deg`;}).join(',')});"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:20px;height:20px;background:var(--gold);border-radius:50%;z-index:2;"></div>
        </div>
        <div style="position:absolute;top:0;left:50%;transform:translateX(-50%);width:4px;height:20px;background:var(--gold);z-index:3;"></div>
        <div id="roulette-result" style="position:absolute;right:0;top:50%;transform:translateY(-50%);text-align:center;font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:.1em;min-width:80px;">-</div>
      </div>

      <!-- Bet Controls -->
      <div class="card" style="margin-bottom:1rem;">
        <div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem;">
          <span style="font-size:.75rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.4);">CHIP:</span>
          ${[50,100,500,1000].map(v=>`<button class="btn btn-ghost" style="font-size:.8rem;padding:.3em .7em;" onclick="rouletteGame.bet=${v};document.getElementById('active-chip').textContent=${v};">${Store.fmt(v)}</button>`).join('')}
          <span style="font-size:.8rem;color:var(--gold);">Aktiv: <span id="active-chip">${this.bet}</span></span>
          <button class="btn btn-ghost" style="margin-left:auto;font-size:.8rem;" onclick="rouletteGame.clearBets()">LÖSCHEN</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-bottom:.8rem;">
          ${[['red','🔴 ROT',2],['black','⬛ SCHWARZ',2],['even','GERADE',2],['odd','UNGERADE',2],['1-18','1-18',2],['19-36','19-36',2],['1-12','1-12',3],['13-24','13-24',3],['25-36','25-36',3]].map(([t,l,p])=>`
            <button onclick="rouletteGame.placeBet('${t}',rouletteGame.bet)" style="background:rgba(255,255,255,.05);border:1px solid var(--border);border-radius:4px;padding:.5rem;cursor:pointer;color:var(--text);font-family:'Rajdhani',sans-serif;font-size:.85rem;position:relative;">
              ${l} <small style="color:rgba(255,255,255,.35)">×${p}</small>
              <div class="bet-chip" data-type="${t}" style="position:absolute;top:2px;right:4px;font-size:.65rem;color:var(--gold);"></div>
            </button>`).join('')}
        </div>
        <div style="display:flex;gap:.8rem;align-items:center;">
          <button class="btn btn-red" onclick="rouletteGame.spin()" style="font-size:1rem;">🎡 SPIN!</button>
          <span style="font-size:.9rem;color:rgba(255,255,255,.4);">Einsatz: <strong style="color:var(--gold)" id="bet-total">0</strong> 💰</span>
        </div>
      </div>

      <!-- Number grid -->
      <div style="display:grid;grid-template-columns:repeat(12,1fr);gap:2px;margin-top:.5rem;">
        <div onclick="rouletteGame.placeBet('num-0',rouletteGame.bet)" style="background:#186030;border-radius:3px;padding:.4rem;text-align:center;cursor:pointer;font-size:.75rem;color:#fff;grid-column:span 12;">0</div>
        ${Array.from({length:36},(_,i)=>i+1).map(n=>{const c=this.getColor(n);return `<div onclick="rouletteGame.placeBet('num-${n}',rouletteGame.bet)" style="background:${c==='red'?'#a01818':'#1a1a1a'};border-radius:3px;padding:.3rem;text-align:center;cursor:pointer;font-size:.7rem;color:#fff;">${n}</div>`;}).join('')}
      </div>
    </div>`;
    window.rouletteGame = this;
  }
  destroy(){}
}
