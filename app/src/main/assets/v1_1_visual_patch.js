'use strict';
(function(){
  const esc=s=>'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(s);

  const MAP_SVG=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#3a2112"/><stop offset="1" stop-color="#201006"/></linearGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e2bd7d"/><stop offset=".48" stop-color="#d6a968"/><stop offset="1" stop-color="#c99555"/></linearGradient>
    <filter id="paperNoise"><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="4" seed="8" result="n"/><feColorMatrix in="n" type="matrix" values=".55 0 0 0 .25  0 .42 0 0 .19  0 0 .22 0 .09  0 0 0 .17 0"/><feBlend in="SourceGraphic" mode="multiply"/></filter>
    <filter id="shadow"><feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#160b05" flood-opacity=".7"/></filter>
    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M80 0H0V80" fill="none" stroke="#785735" stroke-opacity=".10" stroke-width="1"/></pattern>
  </defs>
  <rect width="1600" height="900" fill="url(#wood)"/>
  <path d="M28 34Q74 18 120 31Q170 15 222 29Q270 17 324 30Q372 14 430 31Q480 18 538 30Q590 16 650 30Q710 17 770 29Q835 14 898 30Q962 16 1024 30Q1088 15 1150 31Q1212 17 1270 30Q1334 15 1392 31Q1450 18 1570 37L1563 862Q1516 878 1465 864Q1412 880 1361 864Q1306 881 1254 864Q1198 879 1145 863Q1090 880 1035 863Q980 879 925 862Q867 880 813 862Q756 880 700 863Q642 879 587 862Q530 879 474 863Q420 880 365 862Q310 879 255 863Q199 880 144 863Q90 878 35 859Z" fill="url(#paper)" stroke="#6f4826" stroke-width="8" filter="url(#shadow)"/>
  <path d="M38 50H1560V850H38Z" fill="url(#grid)" opacity=".8"/>
  <g filter="url(#paperNoise)" opacity=".55"><path d="M45 55H1555V845H45Z" fill="#d7ab6c"/></g>
  <g fill="none" stroke="#6f5537" stroke-width="2.2" stroke-linecap="round" opacity=".38">
    <path d="M110 190C250 90 430 118 540 210S805 318 980 178 1270 92 1460 190" stroke-dasharray="12 13"/>
    <path d="M95 716C276 640 421 760 589 688S914 650 1098 714 1378 760 1510 667" stroke-dasharray="10 13"/>
    <path d="M240 118C312 282 212 404 330 543S536 732 682 788" stroke-dasharray="9 12"/>
    <path d="M1318 105C1239 243 1378 376 1264 520S1122 682 1041 800" stroke-dasharray="10 12"/>
  </g>
  <g fill="none" stroke="#507b73" stroke-width="4" stroke-linecap="round" opacity=".30">
    <path d="M35 115q92-30 161 12t135 4q50-26 116 6"/><path d="M1155 92q95 42 170 9t236 16"/>
    <path d="M42 770q100 23 170-18t180 0"/><path d="M1201 781q110-35 176 1t177-15"/>
  </g>
  <g stroke="#6e4a2d" fill="none" opacity=".55">
    <circle cx="138" cy="154" r="70" stroke-width="3"/><circle cx="138" cy="154" r="47" stroke-width="1.5"/>
    <path d="M138 72V236M56 154H220M82 98l112 112M194 98L82 210" stroke-width="2"/>
    <path d="M138 72l18 58 64 24-64 18-18 64-18-64-64-18 64-24z" fill="#8a5c32" fill-opacity=".23" stroke-width="2"/>
  </g>
  <g fill="none" stroke="#6a4a2e" stroke-width="3" opacity=".43">
    <path d="M1390 186q40-44 79-3t-16 70q-44 23-69-6t6-61z"/><path d="M1420 182q-13-35 13-48m7 47q19-31 47-26m-55 79q-7 34-37 42"/>
    <path d="M250 676q32-26 70-3t12 56q-34 28-78 3t-4-56z"/><path d="M257 686q31 12 62 0M270 707q23 10 42 1"/>
  </g>
  <g fill="#6d4b2d" opacity=".50">
    <path d="M1495 524l20-35 18 35zM1526 526l27-48 24 48zM1459 531l16-26 15 26z"/>
    <path d="M69 512l20-34 18 34zM104 518l30-49 26 49z"/>
  </g>
  <g fill="none" stroke="#67452a" stroke-width="3" opacity=".50">
    <path d="M1320 665q42-30 78 0l-6 34h-64zM1340 661v-43l36 22h-36m0-9l-25-14m61 23l24-15"/>
    <path d="M217 262q38-28 70 0l-5 29h-59zM236 260v-39l32 20h-32m0-8l-23-13m55 21l21-13"/>
  </g>
  <g fill="#714c2e" opacity=".34"><circle cx="430" cy="82" r="7"/><circle cx="1210" cy="813" r="9"/><circle cx="1065" cy="118" r="5"/><circle cx="511" cy="818" r="6"/></g>
</svg>`;

  const defs=`<defs><linearGradient id="sand" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#dfc081"/><stop offset="1" stop-color="#b98a4d"/></linearGradient><linearGradient id="rock" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#876d4c"/><stop offset="1" stop-color="#4e4132"/></linearGradient><linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#6f8245"/><stop offset="1" stop-color="#31452c"/></linearGradient></defs>`;
  const water=`<path d="M16 74c14 8 24-4 36 2 13 7 24-3 36 2 10 5 19 2 26-1" fill="none" stroke="#4f8d87" stroke-width="5" stroke-linecap="round" opacity=".36"/><path d="M24 83c9 3 17-2 25 1m42 1c8 2 14-2 21-1" fill="none" stroke="#6aa59b" stroke-width="2.5" stroke-linecap="round" opacity=".30"/>`;
  const palm=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0q4-18 2-31" stroke="#62452e" stroke-width="4" fill="none"/><path d="M2-31q-18-8-24 2 17 0 24 6m0-8q18-10 25 0-17 1-25 8m0-8q-7-16-15-17 7 11 15 20m0-3q8-14 18-15-8 9-18 18" fill="url(#leaf)" stroke="#31442c" stroke-width="1"/></g>`;
  const hut=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-13 0v-18h26V0z" fill="#9a6c3d" stroke="#493522" stroke-width="2"/><path d="M-18-18L0-30l18 12z" fill="#b05d39" stroke="#493522" stroke-width="2"/><rect x="-4" y="-10" width="8" height="10" fill="#3d2a1c"/></g>`;
  const tower=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-9 0v-38h18V0z" fill="#6d5035" stroke="#3d2a1d" stroke-width="2"/><path d="M-15-38h30l-6-9H-9z" fill="#9a5936" stroke="#3d2a1d" stroke-width="2"/><path d="M0-47v-15" stroke="#3d2a1d" stroke-width="2"/><path d="M1-61l15 5-15 6z" fill="#7b3028"/></g>`;
  const rock=(x,y,s=1)=>`<path d="M${x-16*s} ${y}l${10*s} ${-28*s} ${14*s} ${-15*s} ${18*s} ${43*s}z" fill="url(#rock)" stroke="#4f4032" stroke-width="${2*s}"/>`;
  const coast=`<path d="M19 69q10-29 38-40 32-11 55 9 17 15 3 37-15 23-48 22-38 0-48-28z" fill="url(#sand)" stroke="#8c7049" stroke-width="2"/>`;
  const svg=(body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 105">${defs}${water}${body}</svg>`;

  const ARTS={
    l1a:svg(`${coast}${rock(48,73,.75)}${hut(75,72,.62)}${palm(49,58,.55)}${palm(91,63,.45)}<path d="M101 80h18" stroke="#6c4e31" stroke-width="3"/>`),
    l1b:svg(`${coast}${rock(42,77,.95)}${rock(82,79,.55)}${palm(58,57,.62)}${palm(91,65,.42)}<path d="M71 77q8-9 18 0" fill="none" stroke="#4d3d30" stroke-width="3"/>`),
    l2a:svg(`${coast}${rock(42,72,.9)}${hut(77,70,.72)}${hut(98,76,.52)}${palm(48,54,.64)}${palm(96,55,.46)}<path d="M106 82h18M111 82v13M120 82v13" stroke="#62452e" stroke-width="2.5"/>`),
    l2b:svg(`${coast}${rock(50,74,1.02)}${tower(63,66,.58)}${hut(89,76,.58)}${palm(45,54,.55)}${palm(101,62,.45)}`),
    l3a:svg(`${coast}${rock(49,76,1.12)}${tower(60,65,.72)}${hut(92,76,.67)}${hut(34,78,.47)}${palm(35,56,.48)}${palm(103,57,.48)}<path d="M25 82h88" stroke="#6c4e31" stroke-width="2" stroke-dasharray="3 3"/>`),
    l3b:svg(`${coast}${rock(44,77,1.0)}${rock(78,75,.8)}${tower(72,64,.66)}${hut(98,77,.56)}${palm(39,55,.52)}${palm(103,59,.45)}<path d="M96 83h26M104 83v12M117 83v12" stroke="#62452e" stroke-width="2.5"/>`),
    base:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 120">${defs}<path d="M14 88c14 7 25-2 37 2 17 6 35-2 49 2 14 4 25 0 36-4" fill="none" stroke="#4f8d87" stroke-width="6" stroke-linecap="round" opacity=".34"/><path d="M20 84q9-35 41-47 38-13 67 13 17 16 0 37-18 22-56 22-40 0-52-25z" fill="url(#sand)" stroke="#8c7049" stroke-width="2"/>${rock(50,86,1.05)}<g transform="translate(75 78)"><path d="M-31 0v-34h62V0z" fill="#7f6547" stroke="#46372a" stroke-width="3"/><path d="M-39-25v25h16v-42h-16v13m62 4v25h16v-42H23v13" fill="#756044" stroke="#46372a" stroke-width="3"/><path d="M-35-42h8v-9h8v9h8v-9h8v9h8v-9h8v9h8" fill="none" stroke="#46372a" stroke-width="3"/><path d="M-5 0v-19h10V0" fill="#38291d"/><path d="M0-51v-18" stroke="#38291d" stroke-width="2"/><path d="M1-68l21 7-21 7z" fill="#7b3028"/></g>${palm(29,67,.45)}${palm(119,67,.45)}</svg>`
  };

  document.documentElement.style.setProperty('--pirates-map',`url("${esc(MAP_SVG)}")`);
  for(const [k,v] of Object.entries(ARTS)) document.documentElement.style.setProperty(`--art-${k}`,`url("${esc(v)}")`);

  const css=document.createElement('style');
  css.textContent=`
    html,body,#app,.mapViewport{background:#2b190e!important}
    .mapScene{width:1600px!important;height:900px!important;background-image:var(--pirates-map)!important;background-size:1600px 900px!important;background-position:center!important;background-repeat:no-repeat!important;box-shadow:none!important}
    .mapScene:before{display:none!important}.mapDecor{display:none!important}.routeSvg{width:1600px!important;height:900px!important}
    .route{stroke:#6e5336!important;stroke-width:3!important;stroke-dasharray:11 12!important;opacity:.46!important}.route.hot{stroke:#b8762f!important;opacity:.94!important;filter:drop-shadow(0 0 3px #d69b50)!important}

    .tile{background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important}
    .tile:before,.tile:after{content:none!important;display:none!important}
    .islandArt{position:absolute;left:50%;top:50%;transform:translate(-50%,-54%) rotate(var(--rot,0deg));z-index:2;pointer-events:none;filter:drop-shadow(0 1px 1px rgba(54,33,18,.35)) drop-shadow(0 0 2px var(--owner)) drop-shadow(0 0 5px var(--owner))}
    .islandArt svg{display:block;width:100%;height:100%;overflow:visible}
    .tile.l1{width:68px!important;height:56px!important}.tile.l1 .islandArt{width:78px;height:63px}
    .tile.l2{width:76px!important;height:63px!important}.tile.l2 .islandArt{width:88px;height:71px}
    .tile.l3{width:84px!important;height:70px!important}.tile.l3 .islandArt{width:98px;height:79px}
    .tile.legal{outline:2px dashed #f1cb70!important;outline-offset:4px!important;border-radius:15px!important}.tile.movable{outline:none!important}.tile.movable .islandArt{filter:drop-shadow(0 0 3px #fff0bb) drop-shadow(0 0 7px var(--owner))}
    .islandNo{z-index:5!important;bottom:-8px!important;font-size:8px!important;line-height:11px!important;padding:0 4px!important;background:rgba(48,31,17,.78)!important;border-color:rgba(206,176,111,.70)!important}
    .ship{z-index:6!important;top:-18px!important;font-size:20px!important}.enemyShip{font-size:18px!important}

    .base{width:108px!important;height:88px!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important;font-size:0!important}
    .base:before,.base:after{content:none!important;display:none!important}.baseArt{position:absolute;left:50%;top:50%;width:128px;height:102px;transform:translate(-50%,-54%);z-index:2;pointer-events:none;filter:drop-shadow(0 2px 2px rgba(49,28,14,.42)) drop-shadow(0 0 3px var(--baseColor)) drop-shadow(0 0 7px var(--baseColor))}.baseArt svg{width:100%;height:100%;overflow:visible}
    .base .castle{display:none!important}.base .baseMeta{position:relative!important;z-index:5!important;font-size:8px!important;line-height:12px!important;margin-top:62px!important;background:rgba(47,30,17,.76)!important;border:1px solid rgba(193,156,91,.72)!important;border-radius:7px!important;padding:1px 5px!important;white-space:nowrap!important}.base.legal{outline:3px solid #f0c96c!important;outline-offset:5px!important;border-radius:18px!important}

    .mapControls{display:none!important}#homeBtn{display:none!important}
    .topHud{padding:0 14px!important}.roundCard{width:220px!important;padding:4px 12px 6px!important}.roundCard b{font-size:17px!important}.roundCard span{font-size:10px!important}.parchmentChip{height:46px!important;min-width:88px!important;padding:5px 9px!important}.resourceIcon{width:30px!important;height:30px!important;font-size:17px!important}.resourceText b{font-size:17px!important}.resourceText small{font-size:8px!important}

    .bottomHud{padding:0 14px!important;justify-content:flex-end!important;pointer-events:none!important}.bottomHud>*{pointer-events:auto!important}.actionArea{display:flex!important;align-items:flex-end!important}.actionBtn{height:51px!important;min-width:120px!important;font-size:15px!important;border-width:3px!important}
    #rightBoosts{position:absolute!important;right:19px!important;bottom:67px!important;display:flex!important;flex-direction:column-reverse!important;gap:7px!important;pointer-events:auto!important}#rightBoosts .boostBtn{width:48px!important;height:48px!important;border-radius:11px!important;font-size:22px!important;padding:0!important;display:grid!important;place-items:center!important}#rightBoosts .boostBtn small{right:3px!important;bottom:2px!important;font-size:9px!important}

    .turnBoard{background:transparent!important;border:0!important;box-shadow:none!important;left:105px!important;right:175px!important;transform:none!important;width:auto!important;min-width:0!important;max-width:none!important;height:auto!important;padding:0!important;bottom:max(20px,env(safe-area-inset-bottom))!important;pointer-events:none!important}.turnCaption{display:none!important}.timeline{width:100%!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:18px!important}.roundTrack{position:relative!important;display:flex!important;grid-template-columns:none!important;gap:4px!important;padding:0 9px 0 0!important;flex:none!important}.roundTrack:before{display:none!important}.roundTrack:not(:last-child):after{content:''!important;display:block!important;position:absolute!important;right:-5px!important;top:-2px!important;width:1px!important;height:10px!important;background:rgba(67,45,25,.30)!important}.turnMark{display:block!important;width:12px!important;height:4px!important;border-radius:4px!important;flex:none!important;background:var(--mark)!important;opacity:1!important;box-shadow:0 1px 2px rgba(42,25,12,.50)!important}.turnMark.done{opacity:.58!important}.turnMark.current{width:16px!important;height:6px!important;opacity:1!important;outline:1px solid #fff0b7!important;box-shadow:0 0 7px #fff0b7!important;transform:none!important}
  `;
  document.head.appendChild(css);

  function artForTile(el){const id=Number(el.dataset.id);const level=el.classList.contains('l3')?3:el.classList.contains('l2')?2:1;return level===1?ARTS[id%2?'l1a':'l1b']:level===2?ARTS[id%2?'l2a':'l2b']:ARTS[id%2?'l3a':'l3b'];}
  function applyArts(){
    document.querySelectorAll('#map [data-id]').forEach(el=>{let art=el.querySelector('.islandArt');if(!art){art=document.createElement('span');art.className='islandArt';el.prepend(art);}art.innerHTML=artForTile(el);});
    document.querySelectorAll('[data-base]').forEach(el=>{let art=el.querySelector('.baseArt');if(!art){art=document.createElement('span');art.className='baseArt';el.prepend(art);}art.innerHTML=ARTS.base;});
  }
  function applyUi(){
    const svg=document.getElementById('routeSvg');if(svg)svg.setAttribute('viewBox','0 0 1600 900');
    const home=document.getElementById('homeBtn');if(home){home.style.display='none';home.setAttribute('aria-hidden','true');}
    const secret=document.getElementById('secretBtn'),bottom=document.querySelector('.bottomHud');if(secret&&bottom){const count=(typeof S!=='undefined'&&S.players&&S.players.R)?S.players.R.secret:1;secret.innerHTML='🗺<small>×'+count+'</small>';let stack=document.getElementById('rightBoosts');if(!stack){stack=document.createElement('div');stack.id='rightBoosts';bottom.appendChild(stack);}stack.appendChild(secret);}
  }
  function sanity(){const tiles=document.querySelectorAll('#map [data-id]').length,bases=document.querySelectorAll('[data-base]').length,groups=[...document.querySelectorAll('#turnTimeline .roundTrack')],marks=groups.map(g=>g.querySelectorAll('.turnMark').length),totalMarks=marks.reduce((a,b)=>a+b,0),ok=tiles===36&&bases===4&&groups.length===8&&marks.every(n=>n===4)&&totalMarks===32;window.__piratesV11Sanity={tiles,bases,roundGroups:groups.length,marks,totalMarks,ok};document.body.dataset.piratesV11Sanity=ok?'ok':'fail';}

  const oldRender=render;
  render=function(){oldRender();applyArts();applyUi();sanity();};
  setTimeout(function(){applyArts();applyUi();sanity();if(window.resetMapView)window.resetMapView();},160);
  window.addEventListener('resize',()=>setTimeout(sanity,120));
})();