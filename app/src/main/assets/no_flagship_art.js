'use strict';
// Layered Art Pack v1.2. Map Schema 1.0 remains unchanged.
// Existing raster composition is now used only as an outer wood/frame source.
// The playable sea, 36 islands, routes and 4 bases are independent runtime layers.
(function(){
  const ATLAS='art/approved_assets_atlas_v1.webp';
  const RED_BASE='art/base_A_red_v1_1.webp';
  const L1=[1,2,4,5,6,7,12,13,24,25,30,31,32,33,35,36];
  const L2=[3,8,9,11,17,18,19,20,26,28,29,34];
  const L3=[10,14,15,16,21,22,23,27];
  const cells={};
  L1.forEach((id,i)=>cells[id]=i);
  L2.forEach((id,i)=>cells[id]=16+i);
  L3.forEach((id,i)=>cells[id]=28+i);

  const seaSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 450">
    <defs>
      <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#43aab1"/><stop offset=".45" stop-color="#238b98"/><stop offset="1" stop-color="#126c7c"/>
      </linearGradient>
      <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="4" seed="23"/><feColorMatrix type="saturate" values=".35"/><feComponentTransfer><feFuncA type="table" tableValues="0 .22"/></feComponentTransfer></filter>
    </defs>
    <rect width="900" height="450" fill="url(#sea)"/>
    <rect width="900" height="450" filter="url(#noise)" opacity=".48"/>
    <g fill="none" stroke="#d8f3ec" stroke-linecap="round" opacity=".35">
      <path d="M22 74q45-23 87 0t92 1 98 0" stroke-width="3"/>
      <path d="M370 52q54 26 104 0t116 7 130-4" stroke-width="2.5"/>
      <path d="M82 205q64-28 127 1t126-2" stroke-width="3"/>
      <path d="M470 222q53 21 104-1t123 2" stroke-width="2.5"/>
      <path d="M26 354q61 25 126 0t136 4" stroke-width="3"/>
      <path d="M420 372q69-30 139 0t162-5" stroke-width="3"/>
      <path d="M756 120q35-17 68 0" stroke-width="2"/>
      <path d="M260 126q24 12 48 0m-8 282q33-18 66 0" stroke-width="2"/>
    </g>
  </svg>`;
  const seaUrl='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(seaSvg);

  const cellPos=cell=>{
    const c=cell%8,r=Math.floor(cell/8);
    return[(c/7*100).toFixed(4)+'%',(r/4*100).toFixed(4)+'%'];
  };

  const css=[
    'html,body,#app,.mapViewport{background:#2f1b10!important}',
    '.mapScene{width:1800px!important;height:900px!important;background-image:url("art/approved_map_v1_1.webp")!important;background-size:1800px 900px!important;background-position:center!important;background-repeat:no-repeat!important;box-shadow:none!important;overflow:visible!important}',
    '#cleanSeaLayer{position:absolute!important;inset:26px 34px!important;z-index:0!important;background-image:url("'+seaUrl+'")!important;background-size:720px 360px!important;background-repeat:repeat!important;border:15px solid rgba(220,176,105,.96)!important;border-radius:16px 12px 18px 13px!important;box-shadow:inset 0 0 28px rgba(53,29,14,.28),0 5px 12px rgba(25,11,5,.32)!important;pointer-events:none!important}',
    '#cleanSeaLayer:after{content:""!important;position:absolute!important;inset:0!important;box-shadow:inset 0 0 42px rgba(13,66,74,.34)!important;border:2px solid rgba(112,73,38,.42)!important;border-radius:5px!important}',
    '#routeSvg{display:block!important;z-index:1!important;width:1800px!important;height:900px!important;overflow:visible!important}',
    '.route{stroke:rgba(194,156,91,.56)!important;stroke-width:3!important;stroke-dasharray:12 10!important;stroke-linecap:round!important;opacity:.72!important}',
    '#map{z-index:2!important}',
    '.tile{background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;outline:none!important;overflow:visible!important}',
    '.tile:before{content:""!important;display:block!important;position:absolute!important;inset:0!important;background-image:url("'+ATLAS+'")!important;background-size:800% 500%!important;background-position:var(--sprite-x) var(--sprite-y)!important;background-repeat:no-repeat!important;transform:rotate(var(--rot,0deg))!important;filter:drop-shadow(0 3px 2px rgba(25,12,5,.48)) drop-shadow(0 0 2px var(--owner))!important;z-index:2!important;pointer-events:none!important}',
    '.tile.l1{width:118px!important;height:118px!important}.tile.l2{width:136px!important;height:136px!important}.tile.l3{width:150px!important;height:150px!important}',
    '.tile.neutral:before{opacity:.62!important;filter:saturate(.62) contrast(.94) drop-shadow(0 2px 2px rgba(25,12,5,.38))!important}',
    '.tile.claimable:before,.tile.legal:before{opacity:1!important;filter:saturate(1.02) contrast(1.03) drop-shadow(0 3px 2px rgba(25,12,5,.45)) drop-shadow(0 0 4px #f4d176) drop-shadow(0 0 8px #f4d176)!important}',
    '.islandNo{position:absolute!important;left:50%!important;bottom:-5px!important;transform:translateX(-50%)!important;z-index:6!important;white-space:nowrap!important;padding:1px 5px!important;border-radius:7px!important;background:rgba(31,20,14,.76)!important;color:#fff0cf!important;border:1px solid rgba(240,211,154,.55)!important;font:800 8px/11px system-ui,sans-serif!important;text-shadow:0 1px 1px #000!important;box-shadow:0 1px 3px rgba(0,0,0,.32)!important}',
    '.base{z-index:3!important;width:176px!important;height:176px!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;outline:none!important;overflow:visible!important}',
    '.base:before{content:""!important;display:block!important;position:absolute!important;inset:0!important;background-image:url("'+ATLAS+'")!important;background-size:800% 500%!important;background-position:var(--sprite-x) var(--sprite-y)!important;background-repeat:no-repeat!important;filter:drop-shadow(0 4px 3px rgba(24,11,5,.52)) drop-shadow(0 0 3px var(--baseColor))!important;z-index:2!important;pointer-events:none!important}',
    '.base[data-base="A"]{width:205px!important;height:182px!important}',
    '.base[data-base="A"]:before{background-image:url("'+RED_BASE+'")!important;background-size:contain!important;background-position:center!important;background-repeat:no-repeat!important}',
    '.base.legal:before{filter:drop-shadow(0 4px 3px rgba(24,11,5,.5)) drop-shadow(0 0 5px #f4d176) drop-shadow(0 0 9px #f4d176)!important}',
    '.baseMeta{position:absolute!important;left:50%!important;bottom:-3px!important;transform:translateX(-50%)!important;z-index:7!important;white-space:nowrap!important;padding:1px 5px!important;border-radius:7px!important;background:rgba(31,20,14,.78)!important;color:#fff0cf!important;border:1px solid var(--baseColor)!important;font:800 8px/11px system-ui,sans-serif!important;text-shadow:0 1px 1px #000!important;box-shadow:0 1px 3px rgba(0,0,0,.35)!important}'
  ];

  Object.keys(cells).forEach(id=>{
    const [x,y]=cellPos(cells[id]);
    css.push('.tile[data-id="'+id+'"]{--sprite-x:'+x+';--sprite-y:'+y+'}');
  });
  [['B',37],['C',38],['D',39]].forEach(([b,cell])=>{
    const [x,y]=cellPos(cell);
    css.push('.base[data-base="'+b+'"]{--sprite-x:'+x+';--sprite-y:'+y+'}');
  });

  const style=document.createElement('style');
  style.textContent=css.join('');
  document.head.appendChild(style);
})();