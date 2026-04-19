class Match3Game{
  constructor(canvas,onScore,onEnd){
    this.c=canvas;this.ctx=canvas.getContext('2d');this.onScore=onScore||function(){};this.onEnd=onEnd||function(){};
    this.W=canvas.width;this.H=canvas.height;this.cols=8;this.rows=8;
    this.cs=Math.min(Math.floor((Math.min(this.W,this.H)-120)/8),80);
    this.ox=(this.W-this.cols*this.cs)/2;this.oy=(this.H-this.rows*this.cs)/2+16;
    this.gems=['🔴','🟠','🟡','🟢','🔵','🟣'];
    this.board=[];this.score=0;this.sel=null;this.moves=25;this.dead=false;this.processing=false;this.coins=0;
    this.buildBoard();
    this._click=e=>{const r=canvas.getBoundingClientRect();this.handleClick(e.clientX-r.left,e.clientY-r.top);};
    this._kd=e=>{if(e.key===' '&&this.dead){this.onEnd(this.score,this.coins);this.restart();e.preventDefault();}};
    canvas.addEventListener('click',this._click);window.addEventListener('keydown',this._kd);
    this._running=true;this.raf=requestAnimationFrame(()=>this.draw());
  }
  buildBoard(){this.board=[];for(let r=0;r<this.rows;r++){this.board.push([]);for(let c=0;c<this.cols;c++)this.board[r].push(this.rg());}let m=this.getMatches();let safe=0;while(m.length&&safe<100){m.forEach(([r,c])=>this.board[r][c]=this.rg());m=this.getMatches();safe++;}}
  rg(){return this.gems[Math.floor(Math.random()*this.gems.length)];}
  restart(){this.score=0;this.sel=null;this.dead=false;this.moves=25;this.processing=false;this.coins=0;this.buildBoard();}
  handleClick(mx,my){
    if(this.dead||this.processing)return;
    const c=Math.floor((mx-this.ox)/this.cs),r=Math.floor((my-this.oy)/this.cs);
    if(c<0||c>=this.cols||r<0||r>=this.rows)return;
    if(!this.sel){this.sel={r,c};return;}
    const dr=Math.abs(r-this.sel.r),dc=Math.abs(c-this.sel.c);
    if((dr===1&&dc===0)||(dr===0&&dc===1)){this.swap(r,c,this.sel.r,this.sel.c);const m=this.getMatches();if(m.length){this.moves--;this.processing=true;this.cascadeMatches();}else this.swap(r,c,this.sel.r,this.sel.c);}
    this.sel=null;if(this.moves<=0&&!this.processing)this.dead=true;
  }
  swap(r1,c1,r2,c2){const t=this.board[r1][c1];this.board[r1][c1]=this.board[r2][c2];this.board[r2][c2]=t;}
  getMatches(){const m=new Set();for(let r=0;r<this.rows;r++)for(let c=0;c<this.cols-2;c++)if(this.board[r][c]&&this.board[r][c]===this.board[r][c+1]&&this.board[r][c]===this.board[r][c+2])[0,1,2].forEach(i=>m.add(r+','+(c+i)));for(let c=0;c<this.cols;c++)for(let r=0;r<this.rows-2;r++)if(this.board[r][c]&&this.board[r][c]===this.board[r+1][c]&&this.board[r][c]===this.board[r+2][c])[0,1,2].forEach(i=>m.add((r+i)+','+c));return[...m].map(s=>{const[rr,cc]=s.split(',');return[+rr,+cc];});}
  cascadeMatches(){const m=this.getMatches();if(!m.length){this.processing=false;if(this.moves<=0)this.dead=true;return;}m.forEach(([r,c])=>{this.board[r][c]=null;this.score+=5;this.coins+=2;});for(let c=0;c<this.cols;c++){let empty=0;for(let r=this.rows-1;r>=0;r--){if(!this.board[r][c])empty++;else if(empty){this.board[r+empty][c]=this.board[r][c];this.board[r][c]=null;}}for(let r=0;r<empty;r++)this.board[r][c]=this.rg();}this.onScore(this.score);setTimeout(()=>this.cascadeMatches(),180);}
  draw(){
    if(!this._running)return;
    const{ctx:x,W,H,cs,ox,oy}=this;
    x.fillStyle='#06060f';x.fillRect(0,0,W,H);
    x.fillStyle='rgba(255,255,255,.025)';x.beginPath();x.roundRect(ox-4,oy-4,this.cols*cs+8,this.rows*cs+8,8);x.fill();
    for(let r=0;r<this.rows;r++)for(let c=0;c<this.cols;c++){const g=this.board[r][c];if(!g)continue;const gx=ox+c*cs,gy=oy+r*cs;const sel=this.sel&&this.sel.r===r&&this.sel.c===c;if(sel){x.fillStyle='rgba(240,192,64,.3)';x.beginPath();x.roundRect(gx+2,gy+2,cs-4,cs-4,6);x.fill();}x.font=(cs*.62)+'px serif';x.textAlign='center';x.fillText(g,gx+cs/2,gy+cs*.72);}
    x.strokeStyle='rgba(255,255,255,.05)';x.lineWidth=1;for(let r=0;r<=this.rows;r++){x.beginPath();x.moveTo(ox,oy+r*cs);x.lineTo(ox+this.cols*cs,oy+r*cs);x.stroke();}for(let c=0;c<=this.cols;c++){x.beginPath();x.moveTo(ox+c*cs,oy);x.lineTo(ox+c*cs,oy+this.rows*cs);x.stroke();}
    x.fillStyle='rgba(255,255,255,.5)';x.font=W*.03+'px Rajdhani,sans-serif';x.textAlign='left';x.fillText('ZÜGE: '+this.moves,ox,oy-10);
    if(this.dead){x.fillStyle='rgba(0,0,0,.75)';x.fillRect(0,0,W,H);x.fillStyle='#ff8020';x.font='bold '+W*.07+'px Bebas Neue,sans-serif';x.textAlign='center';x.fillText('KEINE ZÜGE',W/2,H/2-30);x.fillStyle='rgba(255,255,255,.5)';x.font=W*.032+'px Rajdhani,sans-serif';x.fillText('LEERTASTE zum Neustart',W/2,H/2+20);}
    this.raf=requestAnimationFrame(()=>this.draw());
  }
  destroy(){this._running=false;cancelAnimationFrame(this.raf);this.c.removeEventListener('click',this._click);window.removeEventListener('keydown',this._kd);this.onEnd(this.score,this.coins);}
}
