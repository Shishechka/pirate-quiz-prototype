'use strict';
(function(){

  var ISLAND_SPRITE='data:image/webp;base64,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';
  document.documentElement.style.setProperty('--island-sprite','url("'+ISLAND_SPRITE+'")');
  var visual=document.createElement('style');
  visual.textContent=`
  html,body,#app,.mapViewport{background:#2a170c!important}
  .topHud{height:48px!important;padding:0 12px!important}
  .parchmentChip{height:40px!important;min-width:78px!important;padding:4px 8px!important;border-radius:9px!important;gap:6px!important}
  .resourceIcon{width:27px!important;height:27px!important;font-size:16px!important;border-width:1px!important}
  .resourceText small{font-size:7px!important;letter-spacing:.06em!important}.resourceText b{font-size:15px!important;line-height:16px!important}
  .roundCard{width:190px!important;padding:3px 10px 5px!important;border-radius:0 0 12px 12px!important}.roundCard b{font-size:15px!important}.roundCard span{font-size:9px!important;margin-top:1px!important;padding:2px 5px!important}
  .mapControls{left:max(7px,env(safe-area-inset-left))!important;top:57px!important;gap:5px!important}.mapControl{width:35px!important;height:35px!important;font-size:17px!important}
  .bottomHud{height:52px!important;padding:0 10px!important}.boostBtn{width:45px!important;height:42px!important;border-radius:10px!important;font-size:20px!important}.boostBtn small{font-size:8px!important}
  .actionBtn{min-width:108px!important;height:48px!important;border-width:3px!important;font-size:14px!important}.secondaryBtn{height:40px!important;padding:0 10px!important;font-size:11px!important}
  .turnBoard{height:36px!important;min-width:300px!important;width:47vw!important;max-width:510px!important;padding:7px 10px!important;border-radius:10px!important}.turnCaption{display:none!important}
  .timeline{display:flex!important;justify-content:center!important;gap:9px!important;align-items:center!important;height:20px!important}.roundTrack{display:flex!important;gap:3px!important;padding:0!important;min-width:0!important}.roundTrack:before,.roundTrack.currentRound:after{display:none!important}
  .turnMark{display:block!important;width:11px!important;height:4px!important;border-radius:3px!important;flex:none!important}.turnMark.current{width:14px!important;height:6px!important;transform:none!important;outline:1px solid #fff1bf!important;box-shadow:0 0 6px #fff1bf!important}
  .shipPanel{top:55px!important;right:10px!important;width:225px!important}
  .tile{font-size:0!important;background:rgba(255,255,255,.08)!important;border:0!important;box-shadow:0 0 0 4px var(--owner),0 3px 8px #2d180b77!important;overflow:visible!important}
  .tile:before{content:''!important;position:absolute!important;inset:-8px!important;background-image:var(--island-sprite)!important;background-repeat:no-repeat!important;background-size:400% 100%!important;background-position:0 0!important;filter:drop-shadow(0 3px 2px #351b0b77)!important;transform:rotate(var(--rot,0deg))!important}
  .tile.l2:before{background-position:33.333% 0!important}.tile.l3:before{background-position:66.666% 0!important}
  .tile.l1{width:70px!important;height:62px!important}.tile.l2{width:78px!important;height:69px!important}.tile.l3{width:88px!important;height:78px!important}
  .islandNo{bottom:-11px!important;font-size:8px!important;line-height:12px!important;padding:0 4px!important;min-width:0!important}
  .tile.legal,.base.legal{outline-width:3px!important;outline-offset:6px!important}.tile.movable{outline-offset:5px!important}
  .base{font-size:0!important;width:88px!important;height:82px!important;background:rgba(255,255,255,.04)!important;border:0!important;box-shadow:0 0 0 4px var(--baseColor),0 4px 10px #1c0f08aa!important}
  .base:before{content:'';position:absolute;inset:-12px;background-image:var(--island-sprite);background-size:400% 100%;background-position:100% 0;background-repeat:no-repeat;filter:drop-shadow(0 3px 3px #1d0f08aa)}
  .base .castle{display:none!important}.base .baseMeta{position:absolute;left:50%;bottom:-12px;transform:translateX(-50%);white-space:nowrap;background:#2d1d12dd;color:#f8e9c7;border:1px solid #b8955a;border-radius:7px;padding:1px 5px;font-size:8px!important;line-height:12px!important;z-index:4}
  .ship{top:-24px!important;font-size:22px!important}.enemyShip{font-size:20px!important}.mapDecor{opacity:.23!important}
  `;
  document.head.appendChild(visual);

  var visualV3=document.createElement('style');
  visualV3.textContent=\`
    .mapScene{
      background-image:url("art/map_bg_sm.webp")!important;
      background-size:100% 100%!important;
      background-position:center!important;
      background-repeat:no-repeat!important;
      box-shadow:none!important;
    }
    .mapDecor{display:none!important}

    .tile{
      background:transparent!important;
      border:0!important;
      box-shadow:none!important;
      border-radius:0!important;
      overflow:visible!important;
    }
    .tile:after{display:none!important}
    .tile:before{
      content:''!important;
      position:absolute!important;
      left:50%!important;
      top:50%!important;
      inset:auto!important;
      background-repeat:no-repeat!important;
      background-position:center!important;
      background-size:contain!important;
      z-index:2!important;
      filter:
        drop-shadow(0 2px 2px rgba(31,17,8,.55))
        drop-shadow(0 0 2px var(--owner))
        drop-shadow(0 0 5px var(--owner))!important;
    }
    .tile.l1{width:82px!important;height:68px!important}
    .tile.l2{width:90px!important;height:76px!important}
    .tile.l3{width:100px!important;height:84px!important}
    .tile.l1:before{
      width:88px!important;height:88px!important;
      background-image:url("art/l1_1_sm.webp")!important;
      background-size:contain!important;
      background-position:center!important;
      transform:translate(-50%,-52%) rotate(var(--rot,0deg))!important;
    }
    .tile.l2:before{
      width:96px!important;height:96px!important;
      background-image:url("art/l2_1_sm.webp")!important;
      background-size:contain!important;
      background-position:center!important;
      transform:translate(-50%,-53%) rotate(var(--rot,0deg))!important;
    }
    .tile.l3:before{
      width:106px!important;height:106px!important;
      background-image:url("art/l3_1_sm.webp")!important;
      background-size:contain!important;
      background-position:center!important;
      transform:translate(-50%,-54%) rotate(var(--rot,0deg))!important;
    }
    .tile.legal{
      outline:2px dashed #f7d979!important;
      outline-offset:4px!important;
      border-radius:18px!important;
    }
    .tile.movable{
      outline:2px dashed #fff0bc!important;
      outline-offset:3px!important;
      border-radius:18px!important;
    }
    .islandNo{
      z-index:5!important;
      bottom:-8px!important;
      font-size:8px!important;
      line-height:11px!important;
      padding:0 4px!important;
    }

    .base{
      width:138px!important;
      height:122px!important;
      background:transparent!important;
      border:0!important;
      box-shadow:none!important;
      border-radius:0!important;
      overflow:visible!important;
      font-size:0!important;
    }
    .base:after{display:none!important}
    .base:before{
      content:''!important;
      position:absolute!important;
      left:50%!important;
      top:50%!important;
      inset:auto!important;
      width:142px!important;
      height:142px!important;
      background-image:url("art/base_sm.webp")!important;
      background-repeat:no-repeat!important;
      background-position:center!important;
      background-size:contain!important;
      transform:translate(-50%,-52%)!important;
      filter:
        drop-shadow(0 4px 3px rgba(27,13,6,.55))
        drop-shadow(0 0 3px var(--baseColor))
        drop-shadow(0 0 7px var(--baseColor))!important;
      z-index:2!important;
    }
    .base.legal{
      outline:3px solid #f7d979!important;
      outline-offset:5px!important;
      border-radius:22px!important;
    }
    .baseLabel{
      position:absolute!important;
      left:50%!important;
      bottom:-5px!important;
      transform:translateX(-50%)!important;
      z-index:5!important;
      white-space:nowrap!important;
      background:rgba(47,30,17,.78)!important;
      color:#f8e9c7!important;
      border:1px solid rgba(195,157,92,.8)!important;
      border-radius:7px!important;
      padding:1px 6px!important;
      font:700 8px/12px system-ui,sans-serif!important;
      text-shadow:none!important;
    }

    .turnBoard{
      background:transparent!important;
      border:0!important;
      box-shadow:none!important;
      padding:0!important;
      height:auto!important;
      min-width:0!important;
      width:auto!important;
      max-width:none!important;
      bottom:max(10px,env(safe-area-inset-bottom))!important;
    }
    .turnCaption{display:none!important}
    .timeline{
      display:flex!important;
      gap:13px!important;
      align-items:center!important;
      justify-content:center!important;
      height:auto!important;
    }
    .roundTrack{
      display:flex!important;
      gap:4px!important;
      padding:0!important;
      min-width:0!important;
    }
    .roundTrack:before,.roundTrack:after{display:none!important}
    .turnMark{
      display:block!important;
      width:13px!important;
      height:4px!important;
      border-radius:4px!important;
      flex:none!important;
      background:var(--mark)!important;
      box-shadow:0 1px 2px rgba(34,20,10,.55)!important;
    }
    .turnMark.done{opacity:.24!important}
    .turnMark.current{
      width:16px!important;
      height:6px!important;
      outline:1px solid #fff0b7!important;
      box-shadow:0 0 7px #fff0b7!important;
      transform:none!important;
    }
  \`;
  document.head.appendChild(visualV3);
  var COLORS_UI={R:'#e24a42',B:'#3d80e7',G:'#3aaa68',P:'#9b57d3'};
  var BASE_POS={A:{x:185,y:145},B:{x:1415,y:145},C:{x:185,y:755},D:{x:1415,y:755}};
  var colX=[345,525,705,895,1075,1255], rowY=[175,280,385,500,615,720];
  var jitterX=[0,-18,12,22,-14,10,16,8,-24,20,-8,18,-10,22,-20,12,20,-18,8,-12,16,-16,24,-10,20,-18,10,18,-22,8,-6,20,-16,14,-18,10];
  var jitterY=[0,10,-8,7,-11,8,-9,11,4,-12,10,-5,8,-7,13,-10,6,0,-8,10,-11,6,11,-4,7,-10,9,-5,12,-8,-5,10,-9,6,-10,8];
  function posOfUi(node){if(typeof node==='string')return BASE_POS[node];var idx=node-1,r=Math.floor(idx/6),c=idx%6;return{x:colX[c]+jitterX[idx],y:rowY[r]+jitterY[idx]};}

  var legacyRender=render;

  newGame=function(){
    var orders=Array.from({length:8},function(){return shuffle(PLAYERS)});
    S={round:1,orders:orders,order:orders[0],idx:0,owners:initialOwners(),bases:{A:3,B:3,C:3,D:3},captured:{A:null,B:null,C:null,D:null},players:{},finished:false};
    PLAYERS.forEach(function(p){S.players[p]={coins:20,flags:0,ship:{hp:3,maxHp:3,dmg:1,pos:BASE[p],sunk:false},secret:1};});
    humanMode='MOVE';secretArmed=false;pending=null;qctx=null;$('log').innerHTML='';
    log('Новая партия. Порядок ходов на все 8 раундов определён заранее.');
    render();resetMapView();advanceUntilHuman();
  };

  endCurrentTurn=function(){
    if(S.finished)return;
    S.idx++;
    if(S.idx>=S.order.length){
      if(S.round>=8){S.finished=true;render();showFinal();return;}
      S.round++;S.order=S.orders[S.round-1];S.idx=0;log('— Раунд '+S.round+'.');
    }
    render();setTimeout(advanceUntilHuman,300);
  };

  render=function(){
    legacyRender();
    $('secretBtn').innerHTML='🗺<small>×'+S.players.R.secret+'</small>';
    $('homeBtn').textContent=S.players.R.ship.sunk?'Завершить':'🚢 База';
    decorateMap();
    renderTimeline();
    updateShipPanel();
    $('roundV').textContent=S.finished?'Финал':'Раунд '+S.round+'/8';
    $('status').textContent=statusTextUi();
    $('shipV').textContent=S.players.R.ship.hp+'/'+S.players.R.ship.maxHp+' · '+S.players.R.ship.dmg;
    $('modeBtn').textContent=humanMode==='MOVE'?'⚔ К атаке':humanMode==='ATTACK'?'⚔ Выбери цель':'✓ Завершить ход';
    $('modeBtn').disabled=S.finished||S.order[S.idx]!=='R'||humanMode==='ATTACK';
  };

  function statusTextUi(){
    if(S.finished)return 'Игра окончена · '+fame('R')+' славы';
    if(S.order[S.idx]!=='R')return 'Ход соперника';
    if(humanMode==='MOVE')return 'Твой ход · перемести флагман';
    if(humanMode==='ATTACK')return secretArmed?'Тайный путь · выбери любую цель':'Твой ход · выбери цель атаки';
    return 'Перегруппировка флагмана';
  }

  function decorateMap(){
    var attackSet=new Set(humanMode==='ATTACK'&&S.order[S.idx]==='R'?legalTargets('R',secretArmed):[]);
    var movable=S.order[S.idx]==='R'&&(humanMode==='MOVE'||humanMode==='POST');
    document.querySelectorAll('#map [data-id]').forEach(function(el){
      var id=Number(el.dataset.id),p=posOfUi(id);
      el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.setProperty('--rot',(((id%5)-2)*1.4)+'deg');el.classList.toggle('legal',attackSet.has(id));el.classList.toggle('movable',movable&&S.owners[id]==='R');
      var oldSmall=el.querySelector('small');if(oldSmall){oldSmall.className='islandNo';oldSmall.textContent=id+' · '+('I'.repeat(lv(id)));}
    });
    ['A','B','C','D'].forEach(function(baseId){
      var el=document.querySelector('[data-base="'+baseId+'"]'),p=BASE_POS[baseId],owner=OWNER_BASE[baseId];
      el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.setProperty('--baseColor',COLORS_UI[owner]);el.classList.toggle('legal',attackSet.has(baseId));var sh=S.players[owner].ship;var ship=(sh.pos===baseId&&!sh.sunk)?' '+(owner==='R'?'🚢':'⛵'):'';el.innerHTML='<span class="baseLabel">База '+baseId+' · '+S.bases[baseId]+ship+'</span>';
    });
    drawRoutesUi(attackSet);
  }

  function drawRoutesUi(attackSet){
    var svg=$('routeSvg');if(!svg)return;svg.innerHTML='';var seen=new Set();
    Object.keys(adj).forEach(function(a){
      var aa=/^\d+$/.test(a)?Number(a):a;
      adj[aa].forEach(function(bb){
        var key=[String(aa),String(bb)].sort().join('|');if(seen.has(key))return;seen.add(key);
        var p1=posOfUi(aa),p2=posOfUi(bb),line=document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1',p1.x);line.setAttribute('y1',p1.y);line.setAttribute('x2',p2.x);line.setAttribute('y2',p2.y);line.setAttribute('class','route'+((attackSet.has(aa)||attackSet.has(bb))?' hot':''));svg.appendChild(line);
      });
    });
  }

  function renderTimeline(){
    var root=$('turnTimeline');if(!root||!S.orders)return;root.innerHTML='';
    for(var r=0;r<8;r++){
      var group=document.createElement('div');group.className='roundTrack';group.dataset.round=String(r+1);if(r===S.round-1)group.classList.add('currentRound');
      S.orders[r].forEach(function(p,i){var mark=document.createElement('span');mark.className='turnMark';mark.style.setProperty('--mark',COLORS_UI[p]);if(r<S.round-1||(r===S.round-1&&i<S.idx))mark.classList.add('done');if(!S.finished&&r===S.round-1&&i===S.idx)mark.classList.add('current');group.appendChild(mark);});
      root.appendChild(group);
    }
  }

  function updateShipPanel(){var el=$('shipStats');if(el)el.textContent='Корпус '+S.players.R.ship.hp+'/'+S.players.R.ship.maxHp+' · Урон '+S.players.R.ship.dmg+' · Монеты '+S.players.R.coins;}

  var view={baseScale:1,zoom:1,tx:0,ty:0,minZoom:1,maxZoom:2.35,pointers:new Map(),startDist:0,startZoom:1,startMid:null,startTx:0,startTy:0,moved:false,blockClick:false};
  function currentScale(){return view.baseScale*view.zoom;}
  function clampView(){var vp=$('mapViewport'),scale=currentScale(),sw=1600*scale,sh=900*scale,vw=vp.clientWidth,vh=vp.clientHeight,minX=Math.min(0,vw-sw),minY=Math.min(0,vh-sh);if(sw<=vw)view.tx=(vw-sw)/2;else view.tx=Math.min(0,Math.max(minX,view.tx));if(sh<=vh)view.ty=(vh-sh)/2;else view.ty=Math.min(0,Math.max(minY,view.ty));}
  function applyView(){clampView();$('mapScene').style.transform='translate('+view.tx+'px,'+view.ty+'px) scale('+currentScale()+')';}
  window.resetMapView=function(){var vp=$('mapViewport');if(!vp||!vp.clientWidth||!vp.clientHeight)return;view.baseScale=Math.max(vp.clientWidth/1600,vp.clientHeight/900);view.zoom=1;view.tx=(vp.clientWidth-1600*view.baseScale)/2;view.ty=(vp.clientHeight-900*view.baseScale)/2;applyView();};
  function zoomBy(mult,cx,cy){var vp=$('mapViewport'),old=currentScale(),rect=vp.getBoundingClientRect(),x=cx==null?rect.left+vp.clientWidth/2:cx,y=cy==null?rect.top+vp.clientHeight/2:cy,lx=x-rect.left,ly=y-rect.top,sceneX=(lx-view.tx)/old,sceneY=(ly-view.ty)/old;view.zoom=Math.min(view.maxZoom,Math.max(view.minZoom,view.zoom*mult));var next=currentScale();view.tx=lx-sceneX*next;view.ty=ly-sceneY*next;applyView();}
  function setupGestures(){
    var vp=$('mapViewport');
    vp.addEventListener('pointerdown',function(e){if(e.target.closest('.hud,.mapControls,.shipPanel,.turnBoard'))return;vp.setPointerCapture(e.pointerId);view.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});view.moved=false;if(view.pointers.size===1){view.startTx=view.tx;view.startTy=view.ty;}else if(view.pointers.size===2){var pts=Array.from(view.pointers.values());view.startDist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);view.startZoom=view.zoom;view.startMid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2};view.startTx=view.tx;view.startTy=view.ty;}});
    vp.addEventListener('pointermove',function(e){if(!view.pointers.has(e.pointerId))return;var prev=view.pointers.get(e.pointerId);view.pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(Math.abs(e.clientX-prev.x)+Math.abs(e.clientY-prev.y)>2)view.moved=true;if(view.pointers.size===1){view.tx+=e.clientX-prev.x;view.ty+=e.clientY-prev.y;applyView();}else if(view.pointers.size===2){var pts=Array.from(view.pointers.values()),dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);if(view.startDist>0){var target=Math.min(view.maxZoom,Math.max(view.minZoom,view.startZoom*dist/view.startDist)),oldZoom=view.zoom;view.zoom=target;var mid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2},rect=vp.getBoundingClientRect(),scaleBefore=view.baseScale*oldZoom,scaleNow=currentScale(),lx=view.startMid.x-rect.left,ly=view.startMid.y-rect.top,sceneX=(lx-view.startTx)/scaleBefore,sceneY=(ly-view.startTy)/scaleBefore;view.tx=(mid.x-rect.left)-sceneX*scaleNow;view.ty=(mid.y-rect.top)-sceneY*scaleNow;applyView();}}});
    function up(e){if(view.pointers.has(e.pointerId))view.pointers.delete(e.pointerId);if(view.moved){view.blockClick=true;setTimeout(function(){view.blockClick=false;},90);}if(view.pointers.size<2)view.startDist=0;}
    vp.addEventListener('pointerup',up);vp.addEventListener('pointercancel',up);vp.addEventListener('wheel',function(e){e.preventDefault();zoomBy(e.deltaY<0?1.12:.9,e.clientX,e.clientY);},{passive:false});vp.addEventListener('click',function(e){if(view.blockClick){e.preventDefault();e.stopPropagation();view.blockClick=false;}},true);window.addEventListener('resize',resetMapView);
  }

  $('shipPanelBtn').onclick=function(){$('shipPanel').classList.toggle('show');};
  $('zoomInBtn').onclick=function(){zoomBy(1.2);};$('zoomOutBtn').onclick=function(){zoomBy(.82);};$('resetMapBtn').onclick=resetMapView;
  $('modeBtn').onclick=function(){if(S.order[S.idx]!=='R'||S.finished)return;if(humanMode==='MOVE'){humanMode='ATTACK';render();}else if(humanMode==='POST'){humanEndAfterPost();}};
  $('newBtn').onclick=newGame;
  setupGestures();
  newGame();
})();