// tower.js
class TowerGame {
  constructor(container, opts) {
    this.el = container;
    this.mult = opts.mult || 1;
    this.onWin = opts.onWin || function(){};
    this.onLose = opts.onLose || function(){};
    this.bet = 100;
    this.rows = 8;
    this.cols = 3;
    this.currentRow = 0;
    this.active = false;
    this.board = [];
    this.currentMult = 1;
    this.MULTS = [1.3,1.7,2.2,3.0,4.2,6.0,9.0,14.0];
    this.render();
  }

  buildBoard() {
    this.board = [];
    for (let r = 0; r < this.rows; r++) {
      const safe = Math.floor(Math.random() * this.cols);
      this.board.push(safe);
    }
  }

  startGame() {
    if (this.bet > Store.getCoins()) { toast('Nicht genug Coins!','error'); return; }
    Store.addCoins(-this.bet);
    Store.addStat('totalLost', this.bet);
    Store.updateNavCoins();
    this.buildBoard();
    this.currentRow = 0;
    this.currentMult = 1;
    this.active = true;
    this.renderBoard();
    this.updateInfo();
  }

  pick(row, col) {
    if (!this.active || row !== this.currentRow) return;
    const safe = this.board[row];
    if (col === safe) {
      this.currentMult = this.MULTS[row];
      this.currentRow++;
      if (this.currentRow >= this.rows) {
        this.active = false;
        const won = Math.round(this.bet * this.currentMult);
        this.onWin(won);
        toast(`🏆 TOP! ${Store.fmt(won)} Coins gewonnen!`,'success');
      }
      this.renderBoard();
      this.updateInfo();
    } else {
      this.active = false;
      this.onLose(0);
      this.renderBoard(true);
      toast('💥 Falsche Wahl!','error');
    }
  }

  cashout() {
    if (!this.active || this.currentRow === 0) return;
    this.active = false;
    const won = Math.round(this.bet * this.currentMult);
    this.onWin(won);
    this.renderBoard();
    toast(`💰 Cashout: ${Store.fmt(won)} Coins`,'success');
  }

  renderBoard(reveal = false) {
    const boardEl = this.el.querySelector('#tower-board');
    if (!boardEl) return;
    boardEl.innerHTML = '';
    for (let r = this.rows - 1; r >= 0; r--) {
      const rowEl = document.createElement('div');
      rowEl.style.cssText = 'display:flex;gap:.5rem;justify-content:center;margin-bottom:.4rem;';
      const m = this.MULTS[r];
      const mEl = document.createElement('div');
      mEl.style.cssText = `width:50px;display:flex;align-items:center;justify-content:flex-end;font-family:'Bebas Neue',sans-serif;font-size:.9rem;color:${r<this.currentRow?'var(--green)':'rgba(255,255,255,.3)'};padding-right:.5rem;`;
      mEl.textContent = '×'+m;
      rowEl.appendChild(mEl);
      for (let c = 0; c < this.cols; c++) {
        const cell = document.createElement('div');
        const isActive = r === this.currentRow && this.active;
        const isPast = r < this.currentRow;
        const isSafe = this.board[r] === c;
        let bg='rgba(255,255,255,.06)',content='?',border='1px solid rgba(255,255,255,.08)';
        if (isPast) {
          bg = isSafe ? 'rgba(48,224,128,.15)' : 'rgba(255,255,255,.04)';
          content = isSafe ? '✅' : '⬜';
          border = isSafe ? '1px solid var(--green)' : '1px solid rgba(255,255,255,.05)';
        } else if (reveal && !isPast) {
          bg = isSafe ? 'rgba(48,224,128,.08)' : 'rgba(224,48,48,.08)';
          content = isSafe ? '✅' : '💀';
        }
        cell.style.cssText = `width:72px;height:48px;border-radius:5px;background:${bg};border:${border};display:flex;align-items:center;justify-content:center;font-size:1.4rem;cursor:${isActive?'pointer':'default'};transition:transform .12s,background .15s;`;
        cell.textContent = content;
        if (isActive) {
          cell.addEventListener('click', () => this.pick(r, c));
          cell.addEventListener('mouseenter', () => cell.style.transform='scale(1.06)');
          cell.addEventListener('mouseleave', () => cell.style.transform='');
        }
        rowEl.appendChild(cell);
      }
      boardEl.appendChild(rowEl);
    }
  }

  updateInfo() {
    const el = this.el.querySelector('#tower-info');
    if (el) el.innerHTML = `Etage ${this.currentRow}/${this.rows} &nbsp;·&nbsp; Mult: <span style="color:var(--gold)">×${this.currentMult}</span> &nbsp;·&nbsp; Pot: <span style="color:var(--gold)">${Store.fmt(Math.round(this.bet*this.currentMult))}</span>`;
  }

  render() {
    this.el.innerHTML = `
    <div style="width:min(96vw,400px);">
      <div class="card" style="margin-bottom:1rem;">
        <div style="display:flex;gap:.8rem;align-items:flex-end;flex-wrap:wrap;">
          <div>
            <label style="font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.4);display:block;margin-bottom:.4rem;">EINSATZ</label>
            <input type="number" value="100" min="1" style="width:100px;background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:.4em .7em;color:var(--text);font-family:'Rajdhani',sans-serif;font-size:.95rem;" oninput="towerGame.bet=+this.value||1"/>
          </div>
          <button class="btn btn-gold" onclick="towerGame.startGame()">STARTEN</button>
          <button class="btn btn-green" onclick="towerGame.cashout()">CASHOUT</button>
        </div>
        <div id="tower-info" style="margin-top:.8rem;font-size:.9rem;color:rgba(255,255,255,.5);">Wähle eine Zelle pro Etage</div>
      </div>
      <div id="tower-board"></div>
    </div>`;
    window.towerGame = this;
    this.renderBoard();
  }
  destroy(){}
}
