'use strict';
// Approved generated map composition: 36 islands + 4 faction bases.
(function(){
  const mapB64=window.__PIRATE_MAP_B64||'';
  const mapUrl='data:image/webp;base64,'+mapB64;
  const style=document.createElement('style');
  style.textContent=[
    'html,body,#app,.mapViewport{background:#3a2417!important}',
    '.mapScene{background-image:url("'+mapUrl+'")!important;background-size:1600px 900px!important;background-position:center!important;background-repeat:no-repeat!important;box-shadow:none!important}',
    '#routeSvg{display:none!important}',
    '.tile,.base{background:transparent!important;border:0!important;box-shadow:none!important;outline:none!important}',
    '.tile:before,.tile:after,.base:before,.base:after{display:none!important;content:none!important}',
    '.tile{width:96px!important;height:78px!important;border-radius:34%!important}',
    '.tile.l2{width:110px!important;height:90px!important}',
    '.tile.l3{width:126px!important;height:104px!important}',
    '.islandNo{position:absolute!important;left:50%!important;bottom:-7px!important;transform:translateX(-50%)!important;z-index:6!important;white-space:nowrap!important;padding:1px 5px!important;border-radius:7px!important;background:rgba(31,20,14,.72)!important;color:#fff0cf!important;border:2px solid var(--owner)!important;font:800 8px/11px system-ui,sans-serif!important;text-shadow:0 1px 1px #000!important;box-shadow:0 1px 3px rgba(0,0,0,.35)!important}',
    '.tile.neutral .islandNo{border-color:rgba(255,239,199,.34)!important;opacity:.70!important}',
    '.tile.claimable .islandNo,.tile.legal .islandNo{opacity:1!important;border-color:#f4d176!important;box-shadow:0 0 7px #f4d176,0 1px 3px rgba(0,0,0,.4)!important}',
    '.base{width:170px!important;height:138px!important;border-radius:30%!important}',
    '.baseMeta{position:absolute!important;left:50%!important;bottom:-3px!important;transform:translateX(-50%)!important;z-index:7!important;white-space:nowrap!important;padding:2px 6px!important;border-radius:7px!important;background:rgba(31,20,14,.76)!important;color:#fff0cf!important;border:2px solid var(--baseColor)!important;font:800 8px/12px system-ui,sans-serif!important;text-shadow:0 1px 1px #000!important;box-shadow:0 1px 3px rgba(0,0,0,.4)!important}',
    '.base.legal .baseMeta{border-color:#f4d176!important;box-shadow:0 0 8px #f4d176,0 1px 3px rgba(0,0,0,.4)!important}'
  ].join('');
  document.head.appendChild(style);
  try{delete window.__PIRATE_MAP_B64;}catch(e){window.__PIRATE_MAP_B64='';}
})();