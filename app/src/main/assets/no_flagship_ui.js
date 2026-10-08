'use strict';
(function(){
  const API=window.PiratesNoFlagship;
  if(!API)throw new Error('Pirates no-flagship engine is not loaded');

  const BASE_POS={A:{x:160,y:205},B:{x:1440,y:205},C:{x:160,y:655},D:{x:1440,y:655}};
  const colX=[330,515,700,900,1085,1270],rowY=[190,280,370,460,550,640];
  const jitterX=[0,-9,8,10,-8,6,8,5,-11,9,-5,8,-6,10,-9,7,9,-7,5,-7,8,-8,11,-6,9,-8,6,8,-10,5,-4,9,-7,7,-8,6];
  const jitterY=[0,4,-4,3,-5,4,-4,5,2,-5,4,-3,4,-4,6,-5,3,0,-4,4,-5,3,5,-3,4,-4,4,-3,5,-4,-3,4,-4,3,-4,3];

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
    '.turnBoard{position:static!important;left:auto!important;right:auto!important;bottom:auto!important;transform:none!important;width:auto!important;min-width:0!important;max-width:none!important;height:auto!important}',
    '.timeline{display:flex!important;flex-direction:column!important;gap:6px!important;align-items:stretch!important;justify-content:flex-start!important}',
    '.turnCaption{display:block!important}',
    '.rightRail .boostBtn{position:relative!important}'
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

  window.fitPirateMap=function(){
    const vp=document.getElementById('mapViewport');
    const scene=document.getElementById('mapScene');
    if(!vp||!scene||!vp.clientWidth||!vp.clientHeight)return;
    const left=18,top=68,right=Math.max(left+600,vp.clientWidth-224),bottom=Math.max(top+360,vp.clientHeight-18);
    const width=right-left,height=bottom-top;
    const scale=Math.min(width/1600,height/900)*.98;
    const tx=left+(width-1600*scale)/2;
    const ty=top+(height-900*scale)/2;
    scene.style.transform='translate('+tx+'px,'+ty+'px) scale('+scale+')';
  };

  window.addEventListener('resize',()=>setTimeout(window.fitPirateMap,50));
  API.newGame();
  setTimeout(window.fitPirateMap,120);
})();