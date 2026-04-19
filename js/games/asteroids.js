class AsteroidsGame{
  constructor(canvas,onScore,onEnd){
    this.c=canvas;this.ctx=canvas.getContext('2d');this.onScore=onScore||function(){};this.onEnd=onEnd||function(){};
    this.W=canvas.width;this.H=canvas.height;
    this.ship={x:canvas.width/2,y:canvas.height/2,angle:-Math.PI/2,vx:0,vy:0};
    this.bullets=[];this.asteroids=[];this.exps=[];this.score=0;this.lives=3;this.dead=false;this.t=0;this.lastShot=0;this.invincible=120;this.coins=0;
    this.keys={};
    this._kd=e=>{this.keys[e.key]=true;if([' ','ArrowLeft','ArrowRight','ArrowUp'].includes(e.key))e.preventDefault();if(e.key===' '&&this.dead){this.onEnd(this.score,this.coins);this.restart();}};
    this._ku=e=>{delete this.keys[e.key];};
    window.addEventListener('keydown',this._kd);window.addEventListener('keyup',this._ku);
    this.spawnAsteroids(5);this._running=true;this._last=performance.now();this.raf=requestAnimationFrame(ts=>this.draw(ts));
  }
  restart(){this.ship={x:this.W/2,y:this.H/2,angle:-Math.PI/2,vx:0,vy:0};this.bullets=[];this.asteroids=[];this.exps=[];this.score=0;this.lives=3;this.dead=false;this.t=0;this.invincible=120;this.coins=0;this.spawnAsteroids(5);}
  spawnAsteroids(n){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,spd=.8+Math.random()*1.8;const side=Math.floor(Math.random()*4);let px,py;if(side===0){px=Math.random()*this.W;py=-50;}else if(side===1){px=this.W+50;py=Math.random()*this.H;}else if(side===2){px=Math.random()*this.W;py=this.H+50;}else{px=-50;py=Math.random()*this.H;}const r=28+Math.random()*28;const pts=7+Math.floor(Math.random()*5);const verts=Array.from({length:pts},(_,j)=>{const aa=j/pts*Math.PI*2;const dr=r*.3;return{a:aa,r:r+(Math.random()*dr-dr/2)};});this.asteroids.push({x:px,y:py,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,r,verts,spin:(.02+Math.random()*.03)*(Math.random()<.5?1:-1),ang:0,size:2});}}
  split(a){if(a.size<=0)return;for(let i=0;i<2;i++){const ang=Math.random()*Math.PI*2,spd=1.5+Math.random()*2;const nr=a.r*.55,pts=6+Math.floor(Math.random()*4);const verts=Array.from({length:pts},(_,j)=>{const aa=j/pts*Math.PI*2;const dr=nr*.3;return{a:aa,r:nr+(Math.random()*dr-dr/2)};});this.asteroids.push({x:a.x,y:a.y,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,r:nr,verts,spin:(.03+Math.random()*.05)*(Math.random()<.5?1:-1),ang:0,size:a.size-1});}}
  draw(ts){
    if(!this._running)return;
    const dt=Math.min((ts-this._last)/16,3);this._last=ts;
    const{ctx:x,W,H,ship,keys}=this;
    if(!this.dead){
      this.t+=dt;if(this.invincible>0)this.invincible-=dt;
      if(keys['ArrowLeft'])ship.angle-=.055*dt;if(keys['ArrowRight'])ship.angle+=.055*dt;
      if(keys['ArrowUp']){ship.vx+=Math.cos(ship.angle)*.35*dt;ship.vy+=Math.sin(ship.angle)*.35*dt;}
      ship.vx*=.988;ship.vy*=.988;ship.x=(ship.x+ship.vx*dt+W)%W;ship.y=(ship.y+ship.vy*dt+H)%H;
      if(keys[' ']&&ts-this.lastShot>200){this.bullets.push({x:ship.x+Math.cos(ship.angle)*24,y:ship.y+Math.sin(ship.angle)*24,vx:Math.cos(ship.angle)*15,vy:Math.sin(ship.angle)*15,life:65});this.lastShot=ts;}
      this.bullets.forEach(b=>{b.x=(b.x+b.vx*dt+W)%W;b.y=(b.y+b.vy*dt+H)%H;b.life-=dt;});this.bullets=this.bullets.filter(b=>b.life>0);
      this.asteroids.forEach(a=>{a.x=(a.x+a.vx*dt+W)%W;a.y=(a.y+a.vy*dt+H)%H;a.ang+=a.spin*dt;});
      this.bullets=this.bullets.filter(b=>{for(let i=0;i<this.asteroids.length;i++){const a=this.asteroids[i];if(Math.hypot(b.x-a.x,b.y-a.y)<a.r){this.score+=a.size===2?20:a.size===1?50:100;this.coins+=a.size===2?5:a.size===1?10:20;this.split(a);this.exps.push({x:a.x,y:a.y,t:0,r:a.r});this.asteroids.splice(i,1);this.onScore(this.score);return false;}}return true;});
      if(this.invincible<=0){for(const a of this.asteroids){if(Math.hypot(ship.x-a.x,ship.y-a.y)<a.r-6){this.lives--;this.exps.push({x:ship.x,y:ship.y,t:0,r:40,big:true});ship.x=W/2;ship.y=H/2;ship.vx=0;ship.vy=0;this.invincible=120;if(this.lives<=0)this.dead=true;break;}}}
      if(this.asteroids.length===0)this.spawnAsteroids(5+Math.floor(this.t/300));
      this.exps.forEach(e=>e.t+=dt);this.exps=this.exps.filter(e=>e.t<20);
    }
    x.fillStyle='#020208';x.fillRect(0,0,W,H);
    for(let i=0;i<100;i++){const sx=(i*137)%W,sy=(i*83)%H;x.fillStyle='rgba(255,255,255,'+(0.1+i%5*.07)+')';x.fillRect(sx,sy,i%3===0?2:1.5,i%3===0?2:1.5);}
    this.asteroids.forEach(a=>{x.save();x.translate(a.x,a.y);x.rotate(a.ang);x.beginPath();a.verts.forEach((v,i)=>{const vx=Math.cos(v.a)*v.r,vy=Math.sin(v.a)*v.r;i===0?x.moveTo(vx,vy):x.lineTo(vx,vy);});x.closePath();x.strokeStyle='rgba(180,180,220,.7)';x.lineWidth=2;x.stroke();x.fillStyle='rgba(100,100,140,.2)';x.fill();x.restore();});
    x.fillStyle='#f0c040';x.shadowColor='#f0c040';x.shadowBlur=10;this.bullets.forEach(b=>{x.beginPath();x.arc(b.x,b.y,4,0,Math.PI*2);x.fill();});x.shadowBlur=0;
    this.exps.forEach(e=>{const r=e.r*(e.t/20);const g=x.createRadialGradient(e.x,e.y,0,e.x,e.y,r);g.addColorStop(0,'rgba(255,180,0,.8)');g.addColorStop(1,'rgba(255,60,0,0)');x.fillStyle=g;x.beginPath();x.arc(e.x,e.y,r,0,Math.PI*2);x.fill();});
    if(!this.dead&&(this.invincible<=0||Math.floor(this.invincible)%8<4)){x.save();x.translate(ship.x,ship.y);x.rotate(ship.angle);x.strokeStyle='#9040ff';x.lineWidth=2;x.shadowColor='#9040ff';x.shadowBlur=12;x.beginPath();x.moveTo(22,0);x.lineTo(-14,14);x.lineTo(-8,0);x.lineTo(-14,-14);x.closePath();x.stroke();x.shadowBlur=0;if(keys['ArrowUp']&&Math.random()<.7){x.strokeStyle='rgba(255,120,0,.9)';x.lineWidth=2;x.beginPath();x.moveTo(-8,0);x.lineTo(-8-10-Math.random()*14,0);x.stroke();}x.restore();}
    x.font='20px serif';x.textAlign='left';for(let i=0;i<this.lives;i++)x.fillText('🚀',10+i*28,H-10);
    x.fillStyle='rgba(255,255,255,.2)';x.font='13px Rajdhani,sans-serif';x.textAlign='center';x.fillText('← → Drehen | ↑ Schub | SPACE Schießen',W/2,H-10);
    if(this.dead){x.fillStyle='rgba(0,0,0,.7)';x.fillRect(0,0,W,H);x.fillStyle='#9040ff';x.font='bold '+W*.08+'px Bebas Neue,sans-serif';x.textAlign='center';x.fillText('GAME OVER',W/2,H/2-30);x.fillStyle='rgba(255,255,255,.5)';x.font=W*.033+'px Rajdhani,sans-serif';x.fillText('LEERTASTE zum Neustart',W/2,H/2+20);}
    this.raf=requestAnimationFrame(ts=>this.draw(ts));
  }
  destroy(){this._running=false;cancelAnimationFrame(this.raf);window.removeEventListener('keydown',this._kd);window.removeEventListener('keyup',this._ku);this.onEnd(this.score,this.coins);}
}
