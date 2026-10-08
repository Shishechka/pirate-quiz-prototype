'use strict';
(function(){
  const esc=s=>'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(s);

  const MAP_SVG=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900">
    <defs>
      <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#d8ae72"/><stop offset=".52" stop-color="#c99a5d"/><stop offset="1" stop-color="#b9854e"/>
      </linearGradient>
      <radialGradient id="light" cx=".5" cy=".42" r=".72">
        <stop offset="0" stop-color="#f2d79d" stop-opacity=".42"/><stop offset=".72" stop-color="#ad7440" stop-opacity=".04"/><stop offset="1" stop-color="#774727" stop-opacity=".18"/>
      </radialGradient>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".024" numOctaves="3" seed="17"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .13"/></feComponentTransfer></filter>
      <pattern id="fibers" width="64" height="64" patternUnits="userSpaceOnUse">
        <path d="M0 14Q18 8 34 15T64 12M0 45Q16 39 31 46T64 43" fill="none" stroke="#805631" stroke-opacity=".07" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="1600" height="900" fill="url(#paper)"/>
    <rect width="1600" height="900" fill="url(#light)"/>
    <rect width="1600" height="900" filter="url(#grain)" opacity=".34"/>
    <rect width="1600" height="900" fill="url(#fibers)"/>
    <g fill="none" stroke="#735034" stroke-linecap="round" opacity=".34">
      <path d="M55 118q96-34 174 3t167 2q70-28 143 7" stroke-width="3"/>
      <path d="M1072 103q99 33 185 1t286 14" stroke-width="3"/>
      <path d="M45 786q111 28 202-10t200 4" stroke-width="3"/>
      <path d="M1160 787q103-37 189-2t204-12" stroke-width="3"/>
      <path d="M74 130q78-19 132 5M1201 129q78 18 151-6M114 756q70 23 145-5M1285 756q77-23 157 6" stroke-width="1.5"/>
    </g>
    <g fill="none" stroke="#695038" opacity=".36">
      <circle cx="132" cy="128" r="70" stroke-width="3"/><circle cx="132" cy="128" r="45" stroke-width="1.5"/>
      <path d="M132 47v162M51 128h162M75 71l114 114M189 71L75 185" stroke-width="2"/>
      <path d="M132 49l15 62 66 17-66 18-15 63-16-63-65-18 65-17z" fill="#8d633b" fill-opacity=".20" stroke-width="2"/>
    </g>
    <g fill="none" stroke="#6f5032" opacity=".28" stroke-width="2">
      <path d="M1410 165q42-37 83 0t-10 69q-42 20-70-8t-3-61z"/>
      <path d="M1399 175q-16-31 15-47m10 52q20-31 50-23m-46 70q-7 31-34 39"/>
      <path d="M240 696q34-25 68 0t5 54q-34 26-70 2t-3-56z"/>
      <path d="M249 705q30 12 56 0M260 724q21 9 39 1"/>
    </g>
    <g fill="#765238" opacity=".30">
      <path d="M75 535l22-39 20 39zM111 539l31-51 29 51z"/>
      <path d="M1451 537l18-31 17 31zM1484 539l28-49 26 49z"/>
    </g>
    <g fill="none" stroke="#755033" stroke-width="2.5" opacity=".30">
      <path d="M1328 677q42-29 79 0l-6 33h-67zM1348 674v-43l37 23h-37m0-9l-25-14m62 23l23-14"/>
      <path d="M206 253q38-27 72 0l-5 30h-61zM227 250v-40l34 21h-34m0-8l-23-13m57 21l22-13"/>
    </g>
    <g fill="#734e32" opacity=".25"><circle cx="470" cy="92" r="6"/><circle cx="1120" cy="812" r="8"/><circle cx="1010" cy="83" r="5"/><circle cx="535" cy="817" r="5"/></g>
  </svg>`;

  const defs=`<defs>
    <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d9bb7c"/><stop offset="1" stop-color="#aa7b48"/></linearGradient>
    <linearGradient id="grass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#788058"/><stop offset="1" stop-color="#46523d"/></linearGradient>
    <linearGradient id="stone" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#81715b"/><stop offset="1" stop-color="#51483b"/></linearGradient>
  </defs>`;
  const waves=`<g fill="none" stroke="#6f8379" stroke-linecap="round" opacity=".26"><path d="M12 82q18 7 34 0t34 1 34-2" stroke-width="3"/><path d="M23 91q12 4 24-1m48 2q11 3 22-2" stroke-width="1.8"/></g>`;
  const coast=`<path d="M17 72Q24 45 48 34q19-10 39-4 29 7 35 28 7 24-18 35-25 12-57 5-25-6-30-26z" fill="url(#sand)" stroke="#8e6b45" stroke-width="2"/><path d="M29 68q7-20 26-27 18-7 36 0 19 7 22 23-10 13-27 18-23 6-43-1-9-3-14-13z" fill="url(#grass)" opacity=".88"/>`;
  const palm=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 4q4-17 2-31" fill="none" stroke="#654c35" stroke-width="4"/><path d="M2-28q-17-9-24 1 16 1 24 7m0-8q17-10 25 0-16 2-25 8m0-8q-6-15-14-17 6 11 14 19m0-2q9-14 18-14-8 9-18 17" fill="#58664a" stroke="#3f4938" stroke-width="1"/></g>`;
  const hut=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-12 0v-17h24V0z" fill="#8e6948" stroke="#55402f" stroke-width="2"/><path d="M-17-17L0-28l17 11z" fill="#8c5940" stroke="#55402f" stroke-width="2"/><rect x="-4" y="-9" width="8" height="9" fill="#433226"/></g>`;
  const tower=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-9 0v-36h18V0z" fill="#73634e" stroke="#4b4034" stroke-width="2"/><path d="M-14-36h28l-5-9H-9z" fill="#77513d" stroke="#4b4034" stroke-width="2"/><path d="M0-45v-14" stroke="#4b4034" stroke-width="2"/><path d="M1-58l13 5-13 5z" fill="#74453b"/></g>`;
  const rock=(x,y,s)=>`<path d="M${x-14*s} ${y}l${9*s} ${-24*s} ${12*s} ${-13*s} ${17*s} ${37*s}z" fill="url(#stone)" stroke="#51463a" stroke-width="${2*s}"/>`;
  const island=body=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 110">${defs}${waves}${body}</svg>`;

  const ISLAND_L1=island(`${coast}${rock(48,82,.70)}${hut(78,79,.58)}${palm(48,63,.52)}${palm(98,67,.38)}`);
  const ISLAND_L2=island(`${coast}${rock(45,82,.88)}${hut(78,79,.70)}${tower(96,78,.43)}${palm(45,61,.57)}${palm(105,66,.40)}<path d="M94 86h25M101 86v10M114 86v10" stroke="#6a5037" stroke-width="2" opacity=".75"/>`);
  const ISLAND_L3=island(`${coast}${rock(43,83,1.0)}${tower(70,77,.64)}${hut(99,82,.58)}${hut(34,83,.42)}${palm(36,61,.46)}${palm(108,65,.42)}<path d="M27 86h86" stroke="#73573a" stroke-width="2" stroke-dasharray="4 3" opacity=".7"/>`);
  const BASE=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 135">${defs}
    <g fill="none" stroke="#6f8379" stroke-linecap="round" opacity=".25"><path d="M13 102q21 8 39 0t38 1 44-3" stroke-width="4"/></g>
    <path d="M17 94q8-39 42-55 39-17 76 6 31 20 17 49-14 30-63 34-52 3-72-34z" fill="url(#sand)" stroke="#8e6b45" stroke-width="2"/>
    <path d="M32 91q9-27 34-38 31-13 59 5 18 12 20 31-17 17-44 21-41 6-69-19z" fill="url(#grass)" opacity=".82"/>
    ${rock(49,105,1.0)}
    <g transform="translate(91 96)">
      <path d="M-35 0v-40h70V0z" fill="#75644f" stroke="#4c4033" stroke-width="3"/>
      <path d="M-44-30V0h18v-50h-18v14m70 6V0h18v-50H26v14" fill="#695a47" stroke="#4c4033" stroke-width="3"/>
      <path d="M-39-50h9v-10h9v10h9v-10h9v10h9v-10h9v10h9" fill="none" stroke="#4c4033" stroke-width="3"/>
      <path d="M-6 0v-22H6V0" fill="#3f3228"/>
      <path d="M0-60v-19" stroke="#403328" stroke-width="2"/><path d="M1-78l22 7-22 7z" fill="#74453b"/>
    </g>
    ${palm(35,80,.43)}${palm(137,85,.42)}
  </svg>`;

  const css=document.createElement('style');
  css.textContent=`
    html,body,#app,.mapViewport{background:#b98650!important}
    .mapScene{width:1600px!important;height:900px!important;background-image:url("${esc(MAP_SVG)}")!important;background-size:1600px 900px!important;background-position:center!important;background-repeat:no-repeat!important;box-shadow:none!important}
    .mapScene:before,.mapDecor{display:none!important}
    .routeSvg{width:1600px!important;height:900px!important}
    .route{stroke:#73543a!important;stroke-width:3!important;stroke-dasharray:11 11!important;opacity:.42!important}
    .route.hot{stroke:#d4ae63!important;opacity:.96!important;filter:drop-shadow(0 0 3px rgba(238,199,111,.7))!important}

    .tile{background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;outline:none!important;overflow:visible!important}
    .tile:before{content:""!important;position:absolute!important;left:50%!important;top:50%!important;background-repeat:no-repeat!important;background-position:center!important;background-size:contain!important;transform:translate(-50%,-53%) rotate(var(--rot,0deg))!important;z-index:2!important;filter:saturate(.88) sepia(.05) contrast(.96) drop-shadow(0 2px 1px rgba(70,43,23,.33)) drop-shadow(0 0 1.5px var(--owner))!important}
    .tile.l1{width:76px!important;height:62px!important}.tile.l1:before{width:86px!important;height:70px!important;background-image:url("${esc(ISLAND_L1)}")!important}
    .tile.l2{width:84px!important;height:68px!important}.tile.l2:before{width:96px!important;height:78px!important;background-image:url("${esc(ISLAND_L2)}")!important}
    .tile.l3{width:92px!important;height:74px!important}.tile.l3:before{width:106px!important;height:86px!important;background-image:url("${esc(ISLAND_L3)}")!important}
    .tile.neutral:before{opacity:.48!important;filter:saturate(.26) sepia(.18) contrast(.86) drop-shadow(0 1px 1px rgba(70,43,23,.22))!important}
    .tile.claimable,.tile.legal{outline:none!important}
    .tile.claimable:before,.tile.legal:before{opacity:1!important;filter:saturate(.96) contrast(1.02) drop-shadow(0 2px 1px rgba(70,43,23,.34)) drop-shadow(0 0 3px #f4d176) drop-shadow(0 0 7px #f4d176)!important}
    .islandNo{z-index:5!important;bottom:-7px!important;font:800 8px/11px system-ui,sans-serif!important;padding:0 4px!important;background:rgba(58,39,25,.76)!important;color:#f3dfb8!important;border:1px solid rgba(209,177,111,.48)!important;border-radius:6px!important;white-space:nowrap!important}

    .base{width:120px!important;height:100px!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;outline:none!important;overflow:visible!important}
    .base:before{content:""!important;position:absolute!important;left:50%!important;top:50%!important;width:140px!important;height:112px!important;background-image:url("${esc(BASE)}")!important;background-repeat:no-repeat!important;background-position:center!important;background-size:contain!important;transform:translate(-50%,-53%)!important;z-index:2!important;filter:saturate(.88) sepia(.05) contrast(.96) drop-shadow(0 2px 2px rgba(68,39,20,.34)) drop-shadow(0 0 2px var(--baseColor))!important}
    .base.legal{outline:none!important}.base.legal:before{filter:saturate(.96) contrast(1.02) drop-shadow(0 2px 2px rgba(68,39,20,.34)) drop-shadow(0 0 4px #f4d176) drop-shadow(0 0 8px #f4d176)!important}
    .baseMeta{z-index:5!important;bottom:-5px!important;font:800 8px/11px system-ui,sans-serif!important;padding:1px 5px!important;background:rgba(58,39,25,.76)!important;color:#f3dfb8!important;border:1px solid rgba(209,177,111,.48)!important;border-radius:6px!important}
  `;
  document.head.appendChild(css);
})();