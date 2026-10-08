'use strict';
// HUD checkpoint: compact resources, live standings, bottom turn timeline.
(function(){
  const API=window.PiratesNoFlagship;
  if(!API)throw new Error('Pirates no-flagship engine is not loaded');

  const BASE_POS={A:{x:185,y:145},B:{x:1415,y:145},C:{x:185,y:755},D:{x:1415,y:755}};
  const colX=[345,525,705,895,1075,1255],rowY=[175,280,385,500,615,720];
  const jitterX=[0,-18,12,22,-14,10,16,8,-24,20,-8,18,-10,22,-20,12,20,-18,8,-12,16,-16,24,-10,20,-18,10,18,-22,8,-6,20,-16,14,-18,10];
  const jitterY=[0,10,-8,7,-11,8,-9,11,4,-12,10,-5,8,-7,13,-10,6,0,-8,10,-11,6,11,-4,7,-10,9,-5,12,-8,-5,10,-9,6,-10,8];

  function pos(node){
    if(typeof node==='string')return BASE_POS[node];
    const idx=node-1,r=Math.floor(idx/6),c=idx%6;
    return{x:colX[c]+jitterX[idx],y:rowY[r]+jitterY[idx]};
  }

  const style=document.createElement('style');
  style.textContent=[
    '.mapControls,.shipPanel,.ship{display:none!important}',
    '.tile.neutral .islandArt{opacity:.48!important;filter:saturate(.35) sepia(.18) contrast(.9)!important}',
    '.tile.claimable{outline:3px solid rgba(246,211,119,.96)!important;outline-offset:5px!important;border-radius:18px!important}',
    '.tile.claimable .islandArt{opacity:1!important;filter:saturate(.86) contrast(.98) drop-shadow(0 0 4px rgba(255,235,172,.72))!important}',
    '.base .baseMeta{border-color:var(--baseColor)!important}',
    '.route.hot{stroke:#f2cb72!important;opacity:.95!important;filter:drop-shadow(0 0 3px #d69b50)!important}',
    '.rightRail .boostBtn{position:relative!important}',
    '.turnBoard{position:absolute!important;z-index:32!important;left:154px!important;right:92px!important;bottom:max(9px,env(safe-area-inset-bottom))!important;width:auto!important;min-width:0!important;max-width:none!important;height:18px!important;padding:0!important;margin:0!important;background:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;pointer-events:none!important;overflow:visible!important}',
    '.turnCaption{display:none!important}',
    '.timeline{display:flex!important;flex-direction:row!important;gap:11px!important;align-items:center!important;justify-content:center!important;width:100%!important;height:18px!important}',
    '.orderGroup{display:flex;flex-direction:row;gap:3px;align-items:center;opacity:.50;flex:0 0 auto}',
    '.orderGroup.doneRound{opacity:.20}.orderGroup.currentRound{opacity:1}.orderGroup.futureRound{opacity:.42}',
    '.orderMark{display:block;width:13px;height:5px;border-radius:2px;background:var(--order-color);box-shadow:0 1px 2px rgba(31,15,6,.7);flex:0 0 auto}',
    '.orderMark.done{opacity:.25}.orderMark.current{height:7px;outline:2px solid #fff4c9;outline-offset:1px;box-shadow:0 0 7px #fff4c9}',
    '@media(max-width:1100px){.turnBoard{left:136px!important;right:82px!important}.timeline{gap:7px!important}.orderGroup{gap:2px!important}.orderMark{width:11px!important;height:4px!important}}',
    '@media(max-height:620px){.turnBoard{left:132px!important;right:78px!important;bottom:7px!important}.timeline{gap:7px!important}.orderMark{width:11px!important;height:4px!important}.orderMark.current{height:6px!important}}'
  ].join('');
  document.head.appendChild(style);

  window.layoutPirateMap=function(legalSet){
    document.querySelectorAll('#map [data-id]').forEach(el=>{
      const id=Number(el.dataset.id),p=pos(id);
      el.style.left=p.x+'px';
      el.style.top=p.y+'px';
      el.style.setProperty('--rot',(((id%5)-2)*1.4)+'deg');
    });
    ['A','B','C','D'].forEach(b=>{
      const el=document.querySelector('[data-base="'+b+'"]'),p=pos(b);
      el.style.left=p.x+'px';
      el.style.top=p.y+'px';
    });
    drawRoutes(legalSet||new Set());
  };

  function drawRoutes(legalSet){
    const svg=document.getElementById('routeSvg');
    if(!svg)return;
    svg.innerHTML='';
    const seen=new Set();
    Object.keys(API.adj).forEach(a=>{
      const aa=/^\d+$/.test(a)?Number(a):a;
      API.adj[aa].forEach(bb=>{
        const key=[String(aa),String(bb)].sort().join('|');
        if(seen.has(key))return;
        seen.add(key);
        const p1=pos(aa),p2=pos(bb);
        const line=document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1',p1.x);
        line.setAttribute('y1',p1.y);
        line.setAttribute('x2',p2.x);
        line.setAttribute('y2',p2.y);
        line.setAttribute('class','route'+((legalSet.has(aa)||legalSet.has(bb))?' hot':''));
        svg.appendChild(line);
      });
    });
  }

  const view={baseScale:1,zoom:1,tx:0,ty:0,minZoom:1,maxZoom:2.6,pointers:new Map(),moved:false,blockClick:false};
  function usableRect(){
    const vp=document.getElementById('mapViewport');
    return{left:0,top:0,right:vp.clientWidth,bottom:vp.clientHeight,width:vp.clientWidth,height:vp.clientHeight};
  }
  function currentScale(){return view.baseScale*view.zoom;}
  function clampView(){
    const u=usableRect(),scale=currentScale(),cw=1600*scale,ch=900*scale;
    if(cw<=u.width)view.tx=u.left+(u.width-cw)/2;
    else view.tx=Math.min(u.left,Math.max(u.right-cw,view.tx));
    if(ch<=u.height)view.ty=u.top+(u.height-ch)/2;
    else view.ty=Math.min(u.top,Math.max(u.bottom-ch,view.ty));
  }
  function applyView(){
    clampView();
    const scene=document.getElementById('mapScene');
    scene.style.transform='translate('+view.tx+'px,'+view.ty+'px) scale('+currentScale()+')';
  }
  window.fitPirateMap=function(){
    const vp=document.getElementById('mapViewport');
    if(!vp||!vp.clientWidth||!vp.clientHeight)return;
    const u=usableRect();
    view.baseScale=Math.max(u.width/1600,u.height/900)*.96;
    view.zoom=1;
    view.tx=(u.width-1600*view.baseScale)/2;
    view.ty=(u.height-900*view.baseScale)/2;
    applyView();
  };
  function zoomAt(mult,clientX,clientY){
    const vp=document.getElementById('mapViewport'),rect=vp.getBoundingClientRect();
    const oldScale=currentScale(),lx=clientX-rect.left,ly=clientY-rect.top;
    const sceneX=(lx-view.tx)/oldScale,sceneY=(ly-view.ty)/oldScale;
    view.zoom=Math.min(view.maxZoom,Math.max(view.minZoom,view.zoom*mult));
    const next=currentScale();
    view.tx=lx-sceneX*next;
    view.ty=ly-sceneY*next;
    applyView();
  }
  function setupGestures(){
    const vp=document.getElementById('mapViewport');
    let startDist=0,startZoom=1,startMid=null,startTx=0,startTy=0;
    vp.addEventListener('pointerdown',e=>{
      vp.setPointerCapture(e.pointerId);
      view.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      view.moved=false;
      if(view.pointers.size===1){startTx=view.tx;startTy=view.ty;}
      if(view.pointers.size===2){
        const pts=[...view.pointers.values()];
        startDist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
        startZoom=view.zoom;
        startMid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2};
        startTx=view.tx;startTy=view.ty;
      }
    });
    vp.addEventListener('pointermove',e=>{
      if(!view.pointers.has(e.pointerId))return;
      const prev=view.pointers.get(e.pointerId);
      view.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(Math.abs(e.clientX-prev.x)+Math.abs(e.clientY-prev.y)>3)view.moved=true;
      if(view.pointers.size===1&&view.zoom>1){
        view.tx+=e.clientX-prev.x;view.ty+=e.clientY-prev.y;applyView();
      }else if(view.pointers.size===2&&startDist>0){
        const pts=[...view.pointers.values()];
        const dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
        view.zoom=Math.min(view.maxZoom,Math.max(view.minZoom,startZoom*dist/startDist));
        const rect=vp.getBoundingClientRect(),scaleBefore=view.baseScale*startZoom,scaleNow=currentScale();
        const mid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2};
        const lx=startMid.x-rect.left,ly=startMid.y-rect.top;
        const sceneX=(lx-startTx)/scaleBefore,sceneY=(ly-startTy)/scaleBefore;
        view.tx=(mid.x-rect.left)-sceneX*scaleNow;
        view.ty=(mid.y-rect.top)-sceneY*scaleNow;
        applyView();
      }
    });
    const finish=e=>{
      if(view.pointers.has(e.pointerId))view.pointers.delete(e.pointerId);
      if(view.moved){view.blockClick=true;setTimeout(()=>{view.blockClick=false;},120);}
      if(view.pointers.size<2)startDist=0;
    };
    vp.addEventListener('pointerup',finish);
    vp.addEventListener('pointercancel',finish);
    vp.addEventListener('wheel',e=>{
      e.preventDefault();
      zoomAt(e.deltaY<0?1.12:.9,e.clientX,e.clientY);
    },{passive:false});
    vp.addEventListener('click',e=>{
      if(!view.blockClick)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();view.blockClick=false;
    },true);
  }

  window.addEventListener('resize',()=>setTimeout(window.fitPirateMap,50));
  setupGestures();
  API.newGame();
  setTimeout(window.fitPirateMap,120);
})();