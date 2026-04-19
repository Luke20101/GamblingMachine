class BreakoutGame{
  constructor(canvas,onScore,onEnd){
    this.c=canvas;this.ctx=canvas.getContext('2d');this.onScore=onScore||function(){};this.onEnd=onEnd||function(){};
    this.W=canvas.width;this.H=canvas.height;this.pw=120;this.ph=14;this.pad={x:canvas.width/2,y:canvas.height-50};
    this.ball={x:canvas.width/2,y:canvas.height-80,vx:5*(Math.random()<.5?1:-1),vy:-7,r:10};
    this.bricks=[];this.score=0;this.dead=false;this.win=false;this.lives=3;this.coins=0;
    this.mouse={x:canvas.width/2};
    this._mm=e=>{const r=canvas.getBoundingClientRect();this.mouse.x=e.clientX-r.left;};
    this._kd=e=>{if(e.key===' '&&(this.dead||this.win)){this.onEnd(this.score,this.coins);this.restart();e.preventDefault();}};
    canvas.addEventListener('mousemove',this._mm);window.addEventListener('keydown',this._kd);
    this.buildBricks();this._running=true;this._last=performance.now();this.raf=requestAnimationFrame(ts=>this.draw(ts));
  }
  buildBricks(){this.bricks=[];const cols=10,rows=5,bw=(this.W-40)/cols,bh=28;const colors=['#e03030','#f0c040','#30e080','#3080ff','#9040ff'];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)this.bricks.push({x:20+c*bw,y:70+r*(bh+6),w:bw-6,h:bh,color:colors[r],alive:true,hp:rows-r});}
  restart(){this.pad.x=this.W/2;this.ball={x:this.W/2,y:this.H-80,vx:5*(Math.random()<.5?1:-1),vy:-7,r:10};this.score=0;this.dead=false;this.win=false;this.lives=3;this.coins=0;this.buildBricks();}
  draw(ts){
    if(!this._running)return;
    const dt=Math.min((ts-this._last)/16,3);this._last=ts;
    const{ctx:x,W,H,ball,pad}=this;
    if(!this.dead&&!this.win){
      pad.x+=(this.mouse.x-pad.x)*.18;pad.x=Math.max(this.pw/2,Math.min(W-this.pw/2,pad.x));
      ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;
      if(ball.x<ball.r||ball.x>W-ball.r)ball.vx*=-1;if(ball.y<ball.r)ball.vy*=-1;
      if(ball.y>H+20){this.lives--;if(this.lives<=0){this.dead=true;}else{ball.x=W/2;ball.y=H-80;ball.vx=5*(Math.random()<.5?1:-1);ball.vy=-7;}}
      if(ball.y>pad.y-this.ph/2-ball.r&&ball.y<pad.y+this.ph&&Math.abs(ball.x-pad.x)<this.pw/2+ball.r&&ball.vy>0){ball.vy=-Math.abs(ball.vy);ball.vx+=(ball.x-pad.x)*.1;}
      for(const b of this.bricks){if(!b.alive)continue;if(ball.x>b.x&&ball.x<b.x+b.w&&ball.y>b.y&&ball.y<b.y+b.h){b.hp--;if(b.hp<=0){b.alive=false;this.score+=10;this.coins+=3;}ball.vy*=-1;break;}}
      if(this.bricks.every(b=>!b.alive))this.win=true;this.onScore(this.score);
    }
    x.fillStyle='#060610';x.fillRect(0,0,W,H);
    this.bricks.forEach(b=>{if(!b.alive)return;const alpha=0.5+b.hp*.15;x.fillStyle=b.color;x.globalAlpha=alpha;x.shadowColor=b.color;x.shadowBlur=5;x.fillRect(b.x,b.y,b.w,b.h);x.globalAlpha=1;x.shadowBlur=0;x.fillStyle='rgba(255,255,255,.12)';x.fillRect(b.x,b.y,b.w,5);});
    const pg=x.createLinearGradient(pad.x-this.pw/2,0,pad.x+this.pw/2,0);pg.addColorStop(0,'#9040ff');pg.addColorStop(.5,'#c080ff');pg.addColorStop(1,'#9040ff');
    x.fillStyle=pg;x.shadowColor='#9040ff';x.shadowBlur=14;x.beginPath();x.roundRect(pad.x-this.pw/2,pad.y-this.ph/2,this.pw,this.ph,7);x.fill();x.shadowBlur=0;
    x.fillStyle='#f0c040';x.shadowColor='#f0c040';x.shadowBlur=20;x.beginPath();x.arc(ball.x,ball.y,ball.r,0,Math.PI*2);x.fill();x.shadowBlur=0;
    x.font='20px serif';x.textAlign='left';for(let i=0;i<this.lives;i++)x.fillText('❤️',10+i*26,H-10);
    const msgs=this.dead?['GAME OVER','#e03030']:this.win?['DU GEWINNST!','#30e080']:null;
    if(msgs){x.fillStyle='rgba(0,0,0,.7)';x.fillRect(0,0,W,H);x.fillStyle=msgs[1];x.font='bold '+W*.08+'px Bebas Neue,sans-serif';x.textAlign='center';x.fillText(msgs[0],W/2,H/2-30);x.fillStyle='rgba(255,255,255,.5)';x.font=W*.033+'px Rajdhani,sans-serif';x.fillText('LEERTASTE zum Neustart',W/2,H/2+20);}
    this.raf=requestAnimationFrame(ts=>this.draw(ts));
  }
  destroy(){this._running=false;cancelAnimationFrame(this.raf);this.c.removeEventListener('mousemove',this._mm);window.removeEventListener('keydown',this._kd);this.onEnd(this.score,this.coins);}
}
