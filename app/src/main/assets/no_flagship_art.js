'use strict';
(function(){
  const style=document.createElement('style');
  style.textContent=[
    '.mapScene{background-image:url("art/map_bg_sm.webp")!important;background-size:100% 100%!important;background-position:center!important;background-repeat:no-repeat!important;box-shadow:none!important}',
    '.tile{background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important}',
    '.tile:after{display:none!important}',
    '.tile:before{content:""!important;position:absolute!important;left:50%!important;top:50%!important;inset:auto!important;background-repeat:no-repeat!important;background-position:center!important;background-size:contain!important;z-index:2!important;filter:drop-shadow(0 2px 2px rgba(31,17,8,.42)) drop-shadow(0 0 2px var(--owner))!important}',
    '.tile.l1{width:82px!important;height:68px!important}.tile.l1:before{width:88px!important;height:88px!important;background-image:url("art/l1_1_sm.webp")!important;transform:translate(-50%,-52%) rotate(var(--rot,0deg))!important}',
    '.tile.l2{width:90px!important;height:76px!important}.tile.l2:before{width:96px!important;height:96px!important;background-image:url("art/l2_1_sm.webp")!important;transform:translate(-50%,-53%) rotate(var(--rot,0deg))!important}',
    '.tile.l3{width:100px!important;height:84px!important}.tile.l3:before{width:106px!important;height:106px!important;background-image:url("art/l3_1_sm.webp")!important;transform:translate(-50%,-54%) rotate(var(--rot,0deg))!important}',
    '.tile.neutral:before{filter:saturate(.45) sepia(.15) contrast(.9) opacity(.58)!important}',
    '.tile.claimable:before{filter:saturate(.96) contrast(1.02) drop-shadow(0 0 5px rgba(255,235,172,.78))!important}',
    '.tile.legal{outline:2px dashed #f7d979!important;outline-offset:4px!important;border-radius:18px!important}',
    '.islandNo{position:absolute!important;z-index:5!important;left:50%!important;bottom:-8px!important;transform:translateX(-50%)!important;white-space:nowrap!important;background:rgba(48,31,17,.78)!important;color:#f7e7c5!important;border:1px solid rgba(206,176,111,.7)!important;border-radius:6px!important;padding:0 4px!important;font:700 8px/11px system-ui,sans-serif!important}',
    '.base{width:138px!important;height:122px!important;background:transparent!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:visible!important;font-size:0!important}',
    '.base:after{display:none!important}',
    '.base:before{content:""!important;position:absolute!important;left:50%!important;top:50%!important;inset:auto!important;width:142px!important;height:142px!important;background-image:url("art/base_sm.webp")!important;background-repeat:no-repeat!important;background-position:center!important;background-size:contain!important;transform:translate(-50%,-52%)!important;filter:drop-shadow(0 4px 3px rgba(27,13,6,.48)) drop-shadow(0 0 3px var(--baseColor))!important;z-index:2!important}',
    '.base.legal{outline:3px solid #f7d979!important;outline-offset:5px!important;border-radius:22px!important}',
    '.baseMeta{position:absolute!important;left:50%!important;bottom:-5px!important;transform:translateX(-50%)!important;z-index:5!important;white-space:nowrap!important;background:rgba(47,30,17,.78)!important;color:#f8e9c7!important;border:1px solid rgba(195,157,92,.8)!important;border-radius:7px!important;padding:1px 6px!important;font:700 8px/12px system-ui,sans-serif!important}'
  ].join('');
  document.head.appendChild(style);
})();