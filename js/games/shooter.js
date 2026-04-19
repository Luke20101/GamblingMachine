class ShooterGame{
  constructor(canvas,onScore,onEnd){
    this.c=canvas;this.ctx=canvas.getContext('2d');this.onScore=onScore||function(){};this.onEnd=onEnd||function(){};
    this.W=canvas.width;this.H=canvas.height;
    this.ship={x:canvas.width/2,y:canvas.height-80,w:30,h:36};
    this.bullets=[];this.enemies=[];this.exps=[];this.score=0;this.lives=3;this.dead=false;this.t=0;this.lastShot=0;this.coins=0;
    this.keys={};
    this._kd=e=>{this.keys[e.key]=true;if([' ','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();if(e.key===' '&&this.dead){this.onEnd(this.score,this.coins);this.restart();}};
    this._ku=e=>{delete this.keys[e.key];};
    window.addEventListener('keydown',this._kd);window.addEventListener('keyup',this._ku);
    this.spawnWave();this._running=true;this._last=performance.now();this.raf=requestAnimationFrame(ts=>this.draw(ts));
  }
  restart(){this.ship.x=this.W/2;this.bullets=[];this.enemies=[];this.score=0;this.lives=3;this.dead=false;this.t=0;this.coins=0;this.spawnWave();}
  spawnWave(){const rows=3,cols=8;for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)this.enemies.push({x:80+c*85,y:55+r*58,vx:1.5,alive:true,icon:['👾','🤖','👽'][r]});}
  draw(ts){
    if(!this._running)return;
    const dt=Math.min((ts-this._last)/16,3);this._last=ts;
    const{ctx:x,W,H,ship,keys}=this;
    if(!this.dead){
      this.t+=dt;
      if(keys['ArrowLeft']&&ship.x>20)ship.x-=7*dt;if(keys['ArrowRight']&&ship.x<W-20)ship.x+=7*dt;
      if(keys[' ']&&ts-this.lastShot>190){this.bullets.push({x:ship.x,y:ship.y-22,vy:-13,enemy:false});this.lastShot=ts;}
      this.bullets.forEach(b=>b.y+=b.vy*dt);this.bullets=this.bullets.filter(b=>b.y>-20&&b.y<H+20);
      const alive=this.enemies.filter(e=>e.alive);let hit=false;
      alive.forEach(e=>{e.x+=e.vx*dt;if(e.x<20||e.x>W-20)hit=true;});
      if(hit){alive.forEach(e=>{e.vx*=-1;e.y+=18;});}
      if(Math.random()<.007&&alive.length){const e=alive[Math.floor(Math.random()*alive.length)];this.bullets.push({x:e.x,y:e.y+20,vy:5,enemy:true});}
      this.bullets=this.bullets.filter(b=>{
        if(b.enemy)return true;
        for(let i=0;i<this.enemies.length;i++){const e=this.enemies[i];if(!e.alive)continue;if(Math.abs(b.x-e.x)<26&&Math.abs(b.y-e.y)<20){e.alive=false;this.score+=10;this.coins+=2;this.exps.push({x:e.x,y:e.y,t:0});this.onScore(this.score);return false;}}return true;
      });
      this.bullets=this.bullets.filter(b=>{if(!b.enemy)return true;if(Math.abs(b.x-ship.x)<ship.w/2&&Math.abs(b.y-ship.y)<ship.h/2){this.lives--;this.exps.push({x:ship.x,y:ship.y,t:0,big:true});if(this.lives<=0)this.dead=true;return false;}return true;});
      if(this.enemies.every(e=>!e.alive))this.spawnWave();if(alive.some(e=>e.y>H-80))this.dead=true;
      this.exps.forEach(e=>e.t+=dt);this.exps=this.exps.filter(e=>e.t<20);
    }
    x.fillStyle='#030308';x.fillRect(0,0,W,H);
    for(let i=0;i<80;i++){const sx=(i*137+this.t*20)%W,sy=(i*83+this.t*10)%H;x.fillStyle='rgba(255,255,255,.3)';x.fillRect(sx,sy,1.5,1.5);}
    this.enemies.forEach(e=>{if(!e.alive)return;x.font='26px serif';x.textAlign='center';x.fillText(e.icon,e.x,e.y+10);});
    this.bullets.forEach(b=>{x.fillStyle=b.enemy?'#e03030':'#00e5ff';x.shadowColor=b.enemy?'#e03030':'#00e5ff';x.shadowBlur=8;x.fillRect(b.x-2.5,b.y,5,13);x.shadowBlur=0;});
    this.exps.forEach(e=>{const r=(e.big?65:30)*(e.t/20);const g=x.createRadialGradient(e.x,e.y,0,e.x,e.y,r);g.addColorStop(0,'rgba(255,180,0,.8)');g.addColorStop(1,'rgba(255,60,0,0)');x.fillStyle=g;x.beginPath();x.arc(e.x,e.y,r,0,Math.PI*2);x.fill();});
    if(!this.dead){x.fillStyle='#3080ff';x.shadowColor='#3080ff';x.shadowBlur=15;x.beginPath();x.moveTo(ship.x,ship.y-ship.h/2);x.lineTo(ship.x-ship.w/2,ship.y+ship.h/2);x.lineTo(ship.x+ship.w/2,ship.y+ship.h/2);x.closePath();x.fill();x.shadowBlur=0;}
    x.font='20px serif';x.textAlign='left';for(let i=0;i<this.lives;i++)x.fillText('🚀',10+i*28,H-10);
    if(this.dead){x.fillStyle='rgba(0,0,0,.7)';x.fillRect(0,0,W,H);x.fillStyle='#3080ff';x.font='bold '+W*.08+'px Bebas Neue,sans-serif';x.textAlign='center';x.fillText('GAME OVER',W/2,H/2-30);x.fillStyle='rgba(255,255,255,.5)';x.font=W*.033+'px Rajdhani,sans-serif';x.fillText('LEERTASTE zum Neustart',W/2,H/2+20);}
    this.raf=requestAnimationFrame(ts=>this.draw(ts));
  }
  destroy(){this._running=false;cancelAnimationFrame(this.raf);window.removeEventListener('keydown',this._kd);window.removeEventListener('keyup',this._ku);this.onEnd(this.score,this.coins);}
}
