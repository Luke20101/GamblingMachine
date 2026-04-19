class DodgeGame{
  constructor(canvas,onScore,onEnd){
    this.c=canvas;this.ctx=canvas.getContext('2d');this.onScore=onScore||function(){};this.onEnd=onEnd||function(){};
    this.W=canvas.width;this.H=canvas.height;
    this.player={x:canvas.width/2,y:canvas.height-80,r:14};
    this.bombs=[];this.score=0;this.dead=false;this.t=0;this.speed=1;this.coins=0;
    this.mouse={x:canvas.width/2,y:canvas.height-80};
    this._mm=e=>{const r=canvas.getBoundingClientRect();this.mouse.x=e.clientX-r.left;this.mouse.y=e.clientY-r.top;};
    this._kd=e=>{if(e.key===' '&&this.dead){this.onEnd(this.score,this.coins);this.restart();e.preventDefault();}};
    canvas.addEventListener('mousemove',this._mm);window.addEventListener('keydown',this._kd);
    this._running=true;this._last=performance.now();this.raf=requestAnimationFrame(ts=>this.draw(ts));
  }
  restart(){this.player.x=this.W/2;this.player.y=this.H-80;this.bombs=[];this.score=0;this.dead=false;this.t=0;this.speed=1;this.coins=0;}
  spawnBomb(){this.bombs.push({x:Math.random()*this.W,y:-20,r:12+Math.random()*18,vy:3+Math.random()*2*this.speed,vx:(Math.random()-.5)*2,col:'hsl('+(Math.random()*30)+',90%,55%)'});}
  draw(ts){
    if(!this._running)return;
    const dt=Math.min((ts-this._last)/16,3);this._last=ts;
    const{ctx:x,W,H}=this;
    if(!this.dead){
      this.t+=dt;this.score=Math.floor(this.t*.6);this.coins=Math.floor(this.t*.6);this.speed=1+this.t*.004;
      if(Math.random()<.03+this.t*.0002)this.spawnBomb();
      const dx=this.mouse.x-this.player.x,dy=this.mouse.y-this.player.y;
      const d=Math.sqrt(dx*dx+dy*dy)||1;const s=Math.min(d,8);
      this.player.x+=dx/d*s;this.player.y+=dy/d*s;
      this.bombs.forEach(b=>{b.y+=b.vy*dt;b.x+=b.vx*dt;});this.bombs=this.bombs.filter(b=>b.y<H+50);
      for(const b of this.bombs){if(Math.hypot(b.x-this.player.x,b.y-this.player.y)<b.r+this.player.r-4){this.dead=true;break;}}
      this.onScore(this.score);
    }
    x.fillStyle='#06060f';x.fillRect(0,0,W,H);
    this.bombs.forEach(b=>{x.fillStyle=b.col;x.shadowColor=b.col;x.shadowBlur=16;x.beginPath();x.arc(b.x,b.y,b.r,0,Math.PI*2);x.fill();x.shadowBlur=0;});
    if(!this.dead){x.fillStyle='#00e5ff';x.shadowColor='#00e5ff';x.shadowBlur=22;x.beginPath();x.arc(this.player.x,this.player.y,this.player.r,0,Math.PI*2);x.fill();x.shadowBlur=0;x.font='18px serif';x.textAlign='center';x.fillText('😎',this.player.x,this.player.y+6);}
    if(this.dead){
      x.fillStyle='rgba(0,0,0,.7)';x.fillRect(0,0,W,H);
      x.fillStyle='#e03030';x.font='bold '+W*.08+'px Bebas Neue,sans-serif';x.textAlign='center';x.fillText('GAME OVER',W/2,H/2-30);
      x.fillStyle='rgba(255,255,255,.5)';x.font=W*.033+'px Rajdhani,sans-serif';x.fillText('LEERTASTE = Neustart | Maus bewegen',W/2,H/2+20);
      x.fillStyle='#e03030';x.font=W*.04+'px Bebas Neue,sans-serif';x.fillText('SCORE: '+this.score,W/2,H/2+65);
    }
    this.raf=requestAnimationFrame(ts=>this.draw(ts));
  }
  destroy(){this._running=false;cancelAnimationFrame(this.raf);this.c.removeEventListener('mousemove',this._mm);window.removeEventListener('keydown',this._kd);this.onEnd(this.score,this.coins);}
}
