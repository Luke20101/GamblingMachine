// blackjack.js
class BlackjackGame {
  constructor(container, opts) {
    this.el = container;
    this.mult = opts.mult || 1;
    this.onWin = opts.onWin || function(){};
    this.onLose = opts.onLose || function(){};
    this.bet = 100;
    this.deck = [];
    this.player = [];
    this.dealer = [];
    this.active = false;
    this.render();
  }

  buildDeck() {
    const suits = ['♠','♥','♦','♣'], vals = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    this.deck = [];
    for (const s of suits) for (const v of vals) this.deck.push({s,v});
    for (let i=this.deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[this.deck[i],this.deck[j]]=[this.deck[j],this.deck[i]];}
  }

  cardVal(card) {
    if(['J','Q','K'].includes(card.v)) return 10;
    if(card.v==='A') return 11;
    return +card.v;
  }

  handVal(hand) {
    let total=0,aces=0;
    for(const c of hand){total+=this.cardVal(c);if(c.v==='A')aces++;}
    while(total>21&&aces){total-=10;aces--;}
    return total;
  }

  startGame() {
    if(this.bet>Store.getCoins()){toast('Nicht genug Coins!','error');return;}
    Store.addCoins(-this.bet);Store.addStat('totalLost',this.bet);Store.updateNavCoins();
    this.buildDeck();
    this.player=[this.deck.pop(),this.deck.pop()];
    this.dealer=[this.deck.pop(),this.deck.pop()];
    this.active=true;
    if(this.handVal(this.player)===21){this.endGame('blackjack');return;}
    this.updateUI();
  }

  hit() {
    if(!this.active)return;
    this.player.push(this.deck.pop());
    if(this.handVal(this.player)>21){this.endGame('bust');}
    else this.updateUI();
  }

  stand() {
    if(!this.active)return;
    while(this.handVal(this.dealer)<17)this.dealer.push(this.deck.pop());
    const pv=this.handVal(this.player),dv=this.handVal(this.dealer);
    if(dv>21||pv>dv)this.endGame('win');
    else if(pv===dv)this.endGame('push');
    else this.endGame('lose');
  }

  double() {
    if(!this.active||this.player.length>2)return;
    if(this.bet>Store.getCoins()){toast('Nicht genug!','error');return;}
    Store.addCoins(-this.bet);this.bet*=2;
    this.player.push(this.deck.pop());
    if(this.handVal(this.player)>21)this.endGame('bust');
    else this.stand();
  }

  endGame(result) {
    this.active=false;
    let won=0;
    if(result==='blackjack'){won=Math.round(this.bet*2.5);this.onWin(won);toast(`🃏 BLACKJACK! +${Store.fmt(won)} Coins`,'success');}
    else if(result==='win'){won=Math.round(this.bet*2);this.onWin(won);toast(`✅ Gewonnen! +${Store.fmt(won)} Coins`,'success');}
    else if(result==='push'){Store.addCoins(this.bet);toast('🤝 Unentschieden — Einsatz zurück','info');}
    else if(result==='bust')toast('💥 Bust! Verloren','error');
    else toast('❌ Dealer gewinnt','error');
    this.updateUI(result);
  }

  cardHTML(c,hidden=false) {
    if(hidden)return`<div style="width:52px;height:78px;background:linear-gradient(135deg,#1a1a3a,#0a0a1e);border:2px solid rgba(255,255,255,.1);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🂠</div>`;
    const red=['♥','♦'].includes(c.s);
    return`<div style="width:52px;height:78px;background:#fff;border-radius:6px;display:flex;flex-direction:column;align-items:flex-start;padding:4px;color:${red?'#c00':'#111'};font-size:.85rem;font-weight:700;border:1px solid rgba(0,0,0,.2);">
      <div>${c.v}</div><div style="font-size:1.2rem">${c.s}</div>
    </div>`;
  }

  updateUI(result=null) {
    const pv=this.handVal(this.player),dv=this.handVal(this.dealer);
    const showAll=!this.active;
    const resColors={win:'#30e080',bust:'#e03030',blackjack:'#f0c040',push:'#3080ff',lose:'#e03030'};
    this.el.querySelector('#bj-content').innerHTML=`
      <div style="text-align:center;margin-bottom:1rem;">
        <div style="font-size:.7rem;letter-spacing:.2em;color:rgba(255,255,255,.4);">DEALER ${showAll?'('+dv+')':'(?)'}</div>
        <div style="display:flex;gap:.5rem;justify-content:center;margin:.6rem 0;flex-wrap:wrap;">
          ${this.dealer.map((c,i)=>this.cardHTML(c,i===1&&!showAll)).join('')}
        </div>
      </div>
      <div style="text-align:center;margin-bottom:1rem;">
        <div style="font-size:.7rem;letter-spacing:.2em;color:rgba(255,255,255,.4);">SPIELER (${pv})</div>
        <div style="display:flex;gap:.5rem;justify-content:center;margin:.6rem 0;flex-wrap:wrap;">
          ${this.player.map(c=>this.cardHTML(c)).join('')}
        </div>
      </div>
      ${result?`<div style="font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:.2em;text-align:center;color:${resColors[result]||'#fff'};margin-bottom:1rem;">${{win:'GEWONNEN!',bust:'BUST!',blackjack:'BLACKJACK!',push:'UNENTSCHIEDEN',lose:'VERLOREN'}[result]||result.toUpperCase()}</div>`:''}
      <div style="display:flex;gap:.8rem;justify-content:center;flex-wrap:wrap;">
        ${this.active?`
          <button class="btn btn-green" onclick="bjGame.hit()">HIT</button>
          <button class="btn btn-gold" onclick="bjGame.stand()">STAND</button>
          ${this.player.length===2?`<button class="btn btn-outline" onclick="bjGame.double()">DOUBLE</button>`:''}
        `:''}
        ${!this.active?`<button class="btn btn-gold" onclick="bjGame.startGame()">NEU SPIELEN</button>`:''}
      </div>`;
  }

  render() {
    this.el.innerHTML=`
    <div style="width:min(96vw,480px);">
      <div class="card" style="margin-bottom:1rem;">
        <div style="display:flex;gap:.8rem;align-items:flex-end;flex-wrap:wrap;">
          <div>
            <label style="font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.4);display:block;margin-bottom:.4rem;">EINSATZ</label>
            <div style="display:flex;gap:.5rem;">
              ${[50,100,500,1000].map(v=>`<button class="btn btn-ghost" style="font-size:.8rem;padding:.3em .7em;" onclick="bjGame.bet=${v}">${Store.fmt(v)}</button>`).join('')}
            </div>
          </div>
          <button class="btn btn-gold" onclick="bjGame.startGame()">DEAL</button>
        </div>
      </div>
      <div id="bj-content"><div style="text-align:center;color:rgba(255,255,255,.3);padding:2rem;">Setze einen Einsatz und drücke DEAL</div></div>
    </div>`;
    window.bjGame = this;
  }
  destroy(){}
}
