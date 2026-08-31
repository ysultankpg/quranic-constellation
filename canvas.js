/* Quranic Constellation — Canvas Rendering Engine */
(function(){
const canvas=document.getElementById("constellation");
const ctx=canvas.getContext("2d");
let W=0,H=0,dpr=1,bgStars=[],canvasBgColor="";
window._qc={stars:[],mode:"mushaf",showConn:true,activeTheme:null,activeJuz:0,hoveredIdx:-1,selectedIdx:-1,filteredSet:null,updateBg:function(c){canvasBgColor=c;}};
const qc=window._qc;

function resize(){
  /* Compute available size from window minus sidebar/header/footer */
  dpr=window.devicePixelRatio||1;
  var isMobile=window.innerWidth<=768;
  var sidebarW=isMobile?0:(window.innerWidth<=1024?160:190);
  var header=document.getElementById("header");
  var headerH=header?header.offsetHeight:50;
  if(isMobile){
    /* On mobile, canvas is flex:1 inside #app — read its laid-out size */
    W=canvas.clientWidth||window.innerWidth;
    H=canvas.clientHeight||(window.innerHeight-headerH);
  }else{
    W=window.innerWidth-sidebarW;
    var guideBar=document.getElementById("guide-bar");
    var guideH=guideBar?guideBar.offsetHeight:26;
    H=window.innerHeight-headerH-guideH-36;
  }
  if(W<200)W=200;if(H<200)H=200;
  canvas.width=W*dpr;canvas.height=H*dpr;
  canvas.style.width=W+"px";canvas.style.height=H+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
  initBg();layoutStars();
}

function initBg(){
  bgStars=[];
  for(let i=0;i<350;i++)bgStars.push({
    x:Math.random()*W,y:Math.random()*H,
    r:Math.random()*1.2+.2,phase:Math.random()*6.28,
    speed:Math.random()*.004+.001
  });
}

function layoutStars(){
  const cx=W/2,cy=H/2;
  /* Elliptical spiral: scale down on mobile portrait to prevent clipping */
  var isMobile=W<768;
  var scaleFactor=isMobile?0.36:0.44;
  const rx=W*scaleFactor,ry=H*scaleFactor;
  const turns=5;
  const positions=S.map((_,i)=>{
    const idx=qc.mode==="mushaf"?i:S[i][3]-1;
    const t=idx/113; /* 0..1 inclusive */
    const angle=t*Math.PI*2*turns+Math.PI*0.5;
    /* spread from center outward: sqrt gives more space at edges */
    const spread=Math.sqrt(t)*0.88+0.08;
    return{x:cx+Math.cos(angle)*rx*spread,y:cy+Math.sin(angle)*ry*spread};
  });

  if(!qc.stars.length){
    qc.stars=positions.map((p,i)=>{
      const v=S[i][2];
      /* Scale star sizes: biggest (Al-Baqarah 286) ~18px, smallest (Al-Kawthar 3) ~4px */
      const size=Math.max(4,Math.min(18,Math.sqrt(v)*0.9));
      return{x:p.x,y:p.y,tx:p.x,ty:p.y,size,pulse:Math.random()*6.28};
    });
  } else {
    qc.stars.forEach((s,i)=>{s.tx=positions[i].x;s.ty=positions[i].y;});
  }
}

function isVisible(i){
  if(qc.activeTheme!==null&&S[i][5]!==qc.activeTheme)return false;
  if(qc.activeJuz>0&&JUZ[i]!==qc.activeJuz)return false;
  if(qc.filteredSet&&!qc.filteredSet.has(i))return false;
  return true;
}

function hexA(hex,a){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return`rgba(${r},${g},${b},${a})`;
}

function isLightMode(){return window.matchMedia&&window.matchMedia("(prefers-color-scheme:light)").matches;}

function drawFrame(){
  var bgColor=canvasBgColor||getComputedStyle(document.documentElement).getPropertyValue("--canvas-bg").trim()||"#080810";
  ctx.fillStyle=bgColor;ctx.fillRect(0,0,W,H);

  /* Background stars */
  var starBaseColor=isLightMode()?"160,140,220":"180,200,255";
  bgStars.forEach(s=>{
    s.phase+=s.speed;
    const a=isLightMode()?(.06+Math.sin(s.phase)*.12):(.12+Math.sin(s.phase)*.3);
    ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.28);
    ctx.fillStyle=`rgba(${starBaseColor},${a})`;ctx.fill();
  });

  /* Juz ring overlay */
  if(qc.activeJuz>0){
    ctx.beginPath();ctx.arc(W/2,H/2,Math.min(W,H)*.46,0,6.28);
    ctx.strokeStyle="rgba(74,158,255,.06)";ctx.lineWidth=50;ctx.stroke();
    ctx.font="600 13px -apple-system,system-ui,sans-serif";
    ctx.fillStyle="rgba(74,158,255,.3)";ctx.textAlign="center";
    ctx.fillText("Juz "+qc.activeJuz,W/2,30);
  }

  /* Connections */
  if(qc.showConn){
    CONNECTIONS.forEach(([a,b])=>{
      const va=isVisible(a),vb=isVisible(b);if(!va&&!vb)return;
      const sa=qc.stars[a],sb=qc.stars[b];
      const hl=qc.hoveredIdx===a||qc.hoveredIdx===b||qc.selectedIdx===a||qc.selectedIdx===b;
      const alpha=hl?0.35:(va&&vb?0.055:0.018);
      ctx.beginPath();ctx.moveTo(sa.x,sa.y);ctx.lineTo(sb.x,sb.y);
      ctx.strokeStyle=hexA(THEMES[S[a][5]].color,alpha);
      ctx.lineWidth=hl?1.8:0.8;ctx.stroke();
    });
  }

  /* Stars */
  qc.stars.forEach((star,i)=>{
    star.x+=(star.tx-star.x)*0.08;
    star.y+=(star.ty-star.y)*0.08;
    star.pulse+=0.016;

    const vis=isVisible(i),theme=THEMES[S[i][5]],color=theme.color;
    let sz=star.size+Math.sin(star.pulse)*0.5;
    let alpha=vis?(isLightMode()?0.9:0.8):0.07;

    if(qc.hoveredIdx===i){sz=star.size*1.4;alpha=1;}
    if(qc.selectedIdx===i){sz=star.size*1.6;alpha=1;}

    /* Outer glow */
    if(vis){
      const g=ctx.createRadialGradient(star.x,star.y,0,star.x,star.y,sz*4);
      g.addColorStop(0,hexA(color,isLightMode()?.15:.2));g.addColorStop(1,hexA(color,0));
      ctx.beginPath();ctx.arc(star.x,star.y,sz*4,0,6.28);ctx.fillStyle=g;ctx.fill();
    }

    /* Core circle */
    ctx.beginPath();ctx.arc(star.x,star.y,sz,0,6.28);
    ctx.fillStyle=hexA(color,alpha);ctx.fill();

    /* Bright center dot */
    if(vis){
      ctx.beginPath();ctx.arc(star.x,star.y,sz*.35,0,6.28);
      ctx.fillStyle=isLightMode()?`rgba(255,255,255,${alpha*.7})`:`rgba(255,255,255,${alpha*.55})`;ctx.fill();
    }

    /* Label on hover/select */
    if(qc.hoveredIdx===i||qc.selectedIdx===i){
      ctx.font="600 11px -apple-system,system-ui,sans-serif";
      ctx.fillStyle=isLightMode()?"#f0f0f8":"#fff";ctx.textAlign="center";
      ctx.fillText((i+1)+". "+S[i][0],star.x,star.y-sz-8);
    }
  });

  requestAnimationFrame(drawFrame);
}

qc.hitTest=function(mx,my){
  const rect=canvas.getBoundingClientRect();
  const x=mx-rect.left,y=my-rect.top;
  for(let i=qc.stars.length-1;i>=0;i--){
    const s=qc.stars[i],dx=x-s.x,dy=y-s.y,r=Math.max(s.size+8,12);
    if(dx*dx+dy*dy<r*r)return i;
  }return-1;
};
qc.relayout=function(){qc.stars=[];layoutStars();};
qc.resize=resize;
qc.starScreenPos=function(i){
  const rect=canvas.getBoundingClientRect();
  return{x:rect.left+qc.stars[i].x,y:rect.top+qc.stars[i].y};
};

/* Ensure layout is computed before first draw */
window.addEventListener("resize",resize);
if(document.readyState==="complete")resize();
else window.addEventListener("load",resize);
resize();
requestAnimationFrame(drawFrame);
})();
