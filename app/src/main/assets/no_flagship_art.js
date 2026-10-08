'use strict';
// Approved Art Pack 1.0: full-resolution Schema 1.0 composition.
// Runtime uses one 1600x900 WebP map built from the accepted unique L1/L2/L3/base assets.
// The source atlas is materialized by CI at art/approved_assets_atlas_v1.webp.
(function(){
  const style=document.createElement('style');
  style.textContent=[
    'html,body,#app,.mapViewport{background:#3a2417!important}',
    '.mapScene{background-image:url("art/approved_map_v1.webp")!important;background-size:1600px 900px!important;background-position:center!important;background-repeat:no-repeat!important;box-shadow:none!important}',
    '#routeSvg{display:none!important}',
    '.tile,.base{background:transparent!important;border:0!important;box-shadow:none!important;outline:none!important}',
    '.tile:before,.tile:after,.base:before,.base:after{display:none!important;content:none!important}',
    '.tile{width:118px!important;height:92px!important;border-radius:34%!important}',
    '.tile.l2{width:142px!important;height:112px!important}',
    '.tile.l3{width:164px!important;height:130px!important}',
    '.islandNo{position:absolute!important;left:50%!important;bottom:-7px!important;transform:translateX(-50%)!important;z-index:6!important;white-space:nowrap!important;padding:1px 5px!important;border-radius:7px!important;background:rgba(31,20,14,.72)!important;color:#fff0cf!important;border:2px solid var(--owner)!important;font:800 8px/11px system-ui,sans-serif!important;text-shadow:0 1px 1px #000!important;box-shadow:0 1px 3px rgba(0,0,0,.35)!important}',
    '.tile.neutral .islandNo{border-color:rgba(255,239,199,.34)!important;opacity:.72!important}',
    '.tile.claimable .islandNo,.tile.legal .islandNo{opacity:1!important;border-color:#f4d176!important;box-shadow:0 0 8px #f4d176,0 1px 3px rgba(0,0,0,.4)!important}',
    '.base{width:205px!important;height:165px!important;border-radius:28%!important}',
    '.baseMeta{position:absolute!important;left:50%!important;bottom:-3px!important;transform:translateX(-50%)!important;z-index:7!important;white-space:nowrap!important;padding:2px 6px!important;border-radius:7px!important;background:rgba(31,20,14,.76)!important;color:#fff0cf!important;border:2px solid var(--baseColor)!important;font:800 8px/12px system-ui,sans-serif!important;text-shadow:0 1px 1px #000!important;box-shadow:0 1px 3px rgba(0,0,0,.4)!important}',
    '.base.legal .baseMeta{border-color:#f4d176!important;box-shadow:0 0 8px #f4d176,0 1px 3px rgba(0,0,0,.4)!important}'
  ].join('');
  document.head.appendChild(style);
})();