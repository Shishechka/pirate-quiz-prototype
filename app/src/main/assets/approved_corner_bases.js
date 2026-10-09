'use strict';
// Approved corner bases v1: actual artwork, restored by the Android CI build.
// Keep artwork orientation unchanged; only scale and placement are adjusted.
(function(){
  const files={
    A:'base_A_red.webp',
    B:'base_B_blue.webp',
    C:'base_C_green.webp',
    D:'base_D_purple.webp'
  };
  const style=document.createElement('style');
  style.textContent=`
    .base{width:216px!important;height:190px!important;overflow:visible!important;isolation:isolate!important}
    .base:before{
      content:''!important;
      display:block!important;
      position:absolute!important;
      inset:-20px -18px!important;
      background-image:var(--approved-base)!important;
      background-position:center center!important;
      background-repeat:no-repeat!important;
      background-size:100% 100%!important;
      -webkit-mask-image:radial-gradient(ellipse 49% 48% at center,#000 73%,rgba(0,0,0,.95) 83%,transparent 100%)!important;
      mask-image:radial-gradient(ellipse 49% 48% at center,#000 73%,rgba(0,0,0,.95) 83%,transparent 100%)!important;
      filter:drop-shadow(0 4px 3px rgba(28,14,7,.45))!important;
      pointer-events:none!important;
      z-index:1!important
    }
    .base .baseMeta{z-index:8!important}
    .base:after{display:none!important;content:none!important}
  `;
  document.head.appendChild(style);
  function apply(){
    Object.entries(files).forEach(([id,file])=>{
      const el=document.querySelector('.base[data-base="'+id+'"]');
      if(el)el.style.setProperty('--approved-base','url("art/'+file+'")');
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});
  else apply();
})();
