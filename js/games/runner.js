class RunnerGame{
  constructor(canvas,onScore,onEnd){
    this.c=canvas;this.ctx=canvas.getContext('2d');this.onScore=onScore||function(){};this.onEnd=onEnd||function(){};
    this.W=canvas.width;this.H=canvas.height;this.ground=this.H*.75;
    this.player={x:120,y:this.ground,vy:0,w:34,h:44,jumping:false};
    this.obstacles=[];this.coins_arr=[];this.score=0;this.speed=6;this.t=0;this.dead=false;this.gap=0;this.coins=0;
    this._kd=e=>{
      if((e.key===' '||e.key==='ArrowUp')&&!this.player.jumping&&!this.dead){this.jump();e.preventDefault();}
      if(e.key===' '&&this.dead){this.onEnd(this.score,this.coins);this.restart();e.preventDefault();}
    };
    this._tc=()=>{if(!this.dead&&!this.player.jumping)this.jump();else if(this.dead){this.onEnd(this.score,this.coins);this.restart();}};
    window.addEventListener('keydown',this._kd);canvas.addEventListener('click',this._tc);
    this._running=true;this._last=performance.now();this.raf=requestAnimationFrame(ts=>this.draw(ts));
  }
  jump(){this.player.vy=-19;this.player.jumping=true;}
  restart(){this.player.y=this.ground;this.player.vy=0;this.player.jumping=false;this.obstacles=[];this.coins_arr=[];this.score=0;this.speed=6;this.t=0;this.dead=false;this.gap=0;this.coins=0;}
  draw(ts){
    if(!this._running)return;
    const dt=Math.min((ts-this._last)/16,3);this._last=ts;
    const{ctx:x,W,H,ground,player}=this;
    if(!this.dead){
      this.t+=dt;this.score=Math.floor(this.t*.5);this.coins=Math.floor(this.t*.5);this.speed=6+this.t*.014;
      this.gap-=this.speed*dt;
      if(this.gap<=0){
        const h=35+Math.random()*55,w=22+Math.random()*18;
        this.obstacles.push({x:W+20,y:ground-h,w,h});
        if(Math.random()<.4)this.coins_arr.push({x:W+60+Math.random()*80,y:ground-h-50-Math.random()*40,r:11,collected:false});
        this.gap=150+Math.random()*200;
      }
      this.obstacles.forEach(o=>o.x-=this.speed*dt);this.coins_arr.forEach(c=>c.x-=this.speed*dt);
      this.obstacles=this.obstacles.filter(o=>o.x>-60);this.coins_arr=this.coins_arr.filter(c=>c.x>-30);
      player.vy+=1.1*dt;player.y+=player.vy*dt;
      if(player.y>=ground){player.y=ground;player.vy=0;player.jumping=false;}
      for(const o of this.obstacles){if(player.x+player.w-10>o.x&&player.x+10<o.x+o.w&&player.y-player.h<o.y+o.h&&player.y>o.y){this.dead=true;break;}}
      for(const c of this.coins_arr){if(!c.collected&&Math.hypot(player.x+17-c.x,player.y-25-c.y)<c.r+14){c.collected=true;this.coins+=20;}}
      this.onScore(this.score);
    }
    x.fillStyle='#080810';x.fillRect(0,0,W,H);
    x.fillStyle='rgba(48,128,255,.04)';
    for(let i=0;i<5;i++){const mx=(i*220+(this.t*this.speed*.008)%220-220);x.beginPath();x.moveTo(mx,ground);x.lineTo(mx+110,ground-100-i*18);x.lineTo(mx+220,ground);x.fill();}
    x.fillStyle='#14142a';x.fillRect(0,ground+2,W,H-ground);x.fillStyle='#3080ff';x.fillRect(0,ground,W,2);
    this.obstacles.forEach(o=>{const g=x.createLinearGradient(o.x,o.y,o.x+o.w,o.y+o.h);g.addColorStop(0,'#e03030');g.addColorStop(1,'#800010');x.fillStyle=g;x.shadowColor='#e03030';x.shadowBlur=8;x.fillRect(o.x,o.y,o.w,o.h);x.shadowBlur=0;});
    this.coins_arr.forEach(c=>{if(c.collected)return;x.fillStyle='#f0c040';x.shadowColor='#f0c040';x.shadowBlur=14;x.beginPath();x.arc(c.x,c.y,c.r,0,Math.PI*2);x.fill();x.shadowBlur=0;x.fillStyle='rgba(0,0,0,.5)';x.font='12px serif';x.textAlign='center';x.fillText('★',c.x,c.y+4);});
    if(!this.dead){x.shadowColor='#9040ff';x.shadowBlur=18;x.fillStyle='#9040ff';x.fillRect(player.x,player.y-player.h,player.w,player.h);x.shadowBlur=0;x.fillStyle='#ffcc88';x.fillRect(player.x+4,player.y-player.h-16,26,20);const leg=Math.sin(this.t*.28)*9;x.fillStyle='#6020cc';x.fillRect(player.x+2,player.y-10,13,12+leg);x.fillRect(player.x+19,player.y-10,13,12-leg);}
    if(this.dead){x.fillStyle='rgba(0,0,0,.7)';x.fillRect(0,0,W,H);x.fillStyle='#e03030';x.font='bold '+W*.08+'px Bebas Neue,sans-serif';x.textAlign='center';x.fillText('GAME OVER',W/2,H/2-30);x.fillStyle='rgba(255,255,255,.5)';x.font=W*.033+'px Rajdhani,sans-serif';x.fillText('KLICKEN oder LEERTASTE',W/2,H/2+20);x.fillStyle='#9040ff';x.font=W*.04+'px Bebas Neue,sans-serif';x.fillText('SCORE: '+this.score,W/2,H/2+65);}
    this.raf=requestAnimationFrame(ts=>this.draw(ts));
  }
  destroy(){this._running=false;cancelAnimationFrame(this.raf);window.removeEventListener('keydown',this._kd);this.c.removeEventListener('click',this._tc);this.onEnd(this.score,this.coins);}
}
