'use strict';
(function(){
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
      el.style.left=p.x+'px';el.style.top=p.y+'px';el.classList.toggle('legal',attackSet.has(id));el.classList.toggle('movable',movable&&S.owners[id]==='R');
      var oldSmall=el.querySelector('small');if(oldSmall){oldSmall.className='islandNo';oldSmall.textContent=id+' · '+('I'.repeat(lv(id)));}
    });
    ['A','B','C','D'].forEach(function(baseId){
      var el=document.querySelector('[data-base="'+baseId+'"]'),p=BASE_POS[baseId],owner=OWNER_BASE[baseId];
      el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.setProperty('--baseColor',COLORS_UI[owner]);el.classList.toggle('legal',attackSet.has(baseId));
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
  window.resetMapView=function(){var vp=$('mapViewport');if(!vp||!vp.clientWidth||!vp.clientHeight)return;view.baseScale=Math.min(vp.clientWidth/1600,vp.clientHeight/900);view.zoom=1;view.tx=(vp.clientWidth-1600*view.baseScale)/2;view.ty=(vp.clientHeight-900*view.baseScale)/2;applyView();};
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