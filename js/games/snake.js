// snake.js
class SnakeGame {
  constructor(canvas, onScore, onEnd) {
    this.c=canvas; this.ctx=canvas.getContext('2d');
    this.onScore=onScore||function(){}; this.onEnd=onEnd||function(){};
    this.cell=24; this.cols=Math.floor(canvas.width/this.cell); this.rows=Math.floor(canvas.height/this.cell);
    this.keys={}; this.score=0; this.dead=false; this.coinsEarned=0;
    this._kd=e=>{this.keys[e.key]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();};
    window.addEventListener('keydown',this._kd);
    this.reset();
    this.loop=setInterval(()=>this.tick(),100);
    this._alive=true; this.raf=requestAnimationFrame(()=>this.draw());
  }
  reset(){
    const cx=Math.floor(this.cols/2),cy=Math.floor(this.rows/2);
    this.snake=[{x:cx,y:cy},{x:cx-1,y:cy},{x:cx-2,y:cy}];
    this.dir={x:1,y:0}; this.nextDir={x:1,y:0};
    this.food=this.rndFood(); this.score=0; this.dead=false; this.coinsEarned=0;
  }
  rndFood(){
    let f;
    do{f={x:Math.floor(Math.random()*this.cols),y:Math.floor(Math.random()*this.rows)};}
    while(this.snake.some(s=>s.x===f.x&&s.y===f.y));
    return f;
  }
  tick(){
    if(!this._alive)return;
    if(this.dead){if(this.keys[' ']){this.keys[' ']=false;this.onEnd(this.score,this.coinsEarned);this.reset();}return;}
    if(this.keys['ArrowUp']&&this.dir.y===0)this.nextDir={x:0,y:-1};
    if(this.keys['ArrowDown']&&this.dir.y===0)this.nextDir={x:0,y:1};
    if(this.keys['ArrowLeft']&&this.dir.x===0)this.nextDir={x:-1,y:0};
    if(this.keys['ArrowRight']&&this.dir.x===0)this.nextDir={x:1,y:0};
    this.dir={...this.nextDir};
    const head={x:this.snake[0].x+this.dir.x,y:this.snake[0].y+this.dir.y};
    if(head.x<0||head.x>=this.cols||head.y<0||head.y>=this.rows||this.snake.some(s=>s.x===head.x&&s.y===head.y)){this.dead=true;return;}
    this.snake.unshift(head);
    if(head.x===this.food.x&&head.y===this.food.y){
      this.score+=10; this.coinsEarned+=5; this.food=this.rndFood();
      this.onScore(this.score);
    } else this.snake.pop();
  }
  draw(){
    if(!this._alive)return;
    const{ctx:x,c:cv,cell:cs}=this;
    x.fillStyle='#0a0a0f';x.fillRect(0,0,cv.width,cv.height);
    x.strokeStyle='rgba(255,255,255,.03)';x.lineWidth=1;
    for(let i=0;i<=this.cols;i++){x.beginPath();x.moveTo(i*cs,0);x.lineTo(i*cs,cv.height);x.stroke();}
    for(let j=0;j<=this.rows;j++){x.beginPath();x.moveTo(0,j*cs);x.lineTo(cv.width,j*cs);x.stroke();}
    x.fillStyle='#e03030';x.shadowColor='#e03030';x.shadowBlur=12;
    x.beginPath();x.arc(this.food.x*cs+cs/2,this.food.y*cs+cs/2,cs/2-3,0,Math.PI*2);x.fill();x.shadowBlur=0;
    this.snake.forEach((s,i)=>{
      const r=1-i/this.snake.length;
      x.fillStyle=`hsl(140,80%,${35+r*25}%)`;x.shadowColor='#30e080';x.shadowBlur=i===0?12:3;
      x.fillRect(s.x*cs+1,s.y*cs+1,cs-2,cs-2);
    });
    x.shadowBlur=0;
    if(this.dead){
      x.fillStyle='rgba(0,0,0,.65)';x.fillRect(0,0,cv.width,cv.height);
      x.fillStyle='#e03030';x.font='bold '+cv.width*.08+'px Bebas Neue,sans-serif';x.textAlign='center';
      x.fillText('GAME OVER',cv.width/2,cv.height/2-30);
      x.fillStyle='rgba(255,255,255,.5)';x.font=cv.width*.035+'px Rajdhani,sans-serif';
      x.fillText('LEERTASTE zum Neustart',cv.width/2,cv.height/2+20);
      x.fillStyle='#30e080';x.font=cv.width*.035+'px Bebas Neue,sans-serif';
      x.fillText('SCORE: '+this.score+'  |  +'+this.coinsEarned+' COINS',cv.width/2,cv.height/2+62);
    }
    this.raf=requestAnimationFrame(()=>this.draw());
  }
  destroy(){this._alive=false;clearInterval(this.loop);cancelAnimationFrame(this.raf);window.removeEventListener('keydown',this._kd);}
}
