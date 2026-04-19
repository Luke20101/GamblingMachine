class PongGame{
  constructor(canvas,onScore,onEnd){
    this.c=canvas;this.ctx=canvas.getContext('2d');
    this.onScore=onScore||function(){};this.onEnd=onEnd||function(){};
    this.W=canvas.width;this.H=canvas.height;this.pw=14;this.ph=90;
    this.p1={y:this.H/2-45,score:0};this.p2={y:this.H/2-45,score:0};
    this.ball={x:this.W/2,y:this.H/2,vx:6*(Math.random()<.5?1:-1),vy:4*(Math.random()<.5?1:-1)};
    this.keys={};this.coins=0;
    this._kd=e=>{this.keys[e.key]=true;};this._ku=e=>{delete this.keys[e.key];};
    window.addEventListener('keydown',this._kd);window.addEventListener('keyup',this._ku);
    this._running=true;this.raf=requestAnimationFrame(()=>this.draw());
  }
  draw(){
    if(!this._running)return;
    const{ctx:x,W,H,pw,ph,p1,p2,ball}=this;
    const spd=6;
    if(this.keys['w']&&p1.y>0)p1.y-=spd;if(this.keys['s']&&p1.y<H-ph)p1.y+=spd;
    if(this.keys['ArrowUp']&&p2.y>0)p2.y-=spd;if(this.keys['ArrowDown']&&p2.y<H-ph)p2.y+=spd;
    ball.x+=ball.vx;ball.y+=ball.vy;
    if(ball.y<=6||ball.y>=H-6)ball.vy*=-1;
    if(ball.x<=pw+10&&ball.y>=p1.y&&ball.y<=p1.y+ph){ball.vx=Math.abs(ball.vx)*1.04;ball.vy+=(ball.y-(p1.y+ph/2))*.12;this.coins+=2;this.onScore(p1.score+p2.score);}
    if(ball.x>=W-pw-10&&ball.y>=p2.y&&ball.y<=p2.y+ph){ball.vx=-Math.abs(ball.vx)*1.04;ball.vy+=(ball.y-(p2.y+ph/2))*.12;this.coins+=2;this.onScore(p1.score+p2.score);}
    if(Math.abs(ball.vx)>15)ball.vx=15*Math.sign(ball.vx);
    if(ball.x<0){p2.score++;this.resetBall(-1);}if(ball.x>W){p1.score++;this.resetBall(1);}
    x.fillStyle='#060610';x.fillRect(0,0,W,H);
    x.setLineDash([12,12]);x.strokeStyle='rgba(255,255,255,.1)';x.lineWidth=2;
    x.beginPath();x.moveTo(W/2,0);x.lineTo(W/2,H);x.stroke();x.setLineDash([]);
    x.fillStyle='#fff';x.shadowColor='#00e5ff';x.shadowBlur=15;
    x.fillRect(8,p1.y,pw,ph);x.fillRect(W-pw-8,p2.y,pw,ph);x.shadowBlur=0;
    x.fillStyle='#fff';x.shadowColor='#fff';x.shadowBlur=20;
    x.beginPath();x.arc(ball.x,ball.y,8,0,Math.PI*2);x.fill();x.shadowBlur=0;
    x.fillStyle='rgba(255,255,255,.22)';x.font='bold '+W*.07+'px Bebas Neue,sans-serif';x.textAlign='center';
    x.fillText(p1.score,W*.25,H*.12);x.fillText(p2.score,W*.75,H*.12);
    x.fillStyle='rgba(255,255,255,.2)';x.font=W*.022+'px Rajdhani,sans-serif';
    x.fillText('W / S',W*.07,H*.95);x.fillText('↑ / ↓',W*.93,H*.95);
    this.raf=requestAnimationFrame(()=>this.draw());
  }
  resetBall(dir){this.ball={x:this.W/2,y:this.H/2,vx:6*dir,vy:4*(Math.random()<.5?1:-1)};}
  destroy(){this._running=false;cancelAnimationFrame(this.raf);window.removeEventListener('keydown',this._kd);window.removeEventListener('keyup',this._ku);this.onEnd(this.p1.score+this.p2.score,this.coins);}
}
