'use strict';
/*
  no-flagship-lab
  Ship gameplay disabled. Legacy ship fields remain only as an inert compatibility
  shell because the inherited renderer expects them; they never move, defend,
  deal damage, receive damage, upgrade, repair, or affect legal actions.
*/
(function(){
  let runToken=0;
  const legacyRender=render;
  const neutralColor='rgba(112,88,56,.34)';

  function inertShip(){
    return {hp:0,maxHp:0,dmg:0,pos:null,sunk:true};
  }

  function playerState(){
    return {coins:20,flags:0,secret:1,ship:inertShip()};
  }

  function claimFront(p){
    const out=new Set();
    const owned=[];
    for(let i=1;i<=36;i++)if(S.owners[i]===p)owned.push(i);
    for(const n of adj[BASE[p]]){
      if(typeof n==='number'&&!S.owners[n])out.add(n);
    }
    for(const id of owned){
      for(const n of adj[id]){
        if(typeof n==='number'&&!S.owners[n])out.add(n);
      }
    }
    if(!out.size){
      for(let i=1;i<=36;i++)if(!S.owners[i])out.add(i);
    }
    return [...out];
  }

  function currentClaimPlayer(){
    if(!S||S.phase!=='CLAIM'||!S.claimQueue)return null;
    return S.claimQueue[S.claimIndex]||null;
  }

  function claimIsland(p,id){
    if(S.phase!=='CLAIM'||S.owners[id])return false;
    const legal=claimFront(p);
    if(!legal.includes(id))return false;
    S.owners[id]=p;
    log(p+' осваивает остров '+id+' (★'+lv(id)+').');
    S.claimIndex++;
    advanceClaimQueue();
    return true;
  }

  function botChooseClaim(p){
    const choices=claimFront(p);
    if(!choices.length)return null;
    choices.sort((a,b)=>{
      const byLevel=lv(b)-lv(a);
      if(byLevel)return byLevel;
      return Math.random()-.5;
    });
    return choices[0];
  }

  function advanceClaimQueue(){
    if(!S||S.phase!=='CLAIM')return;
    const token=runToken;

    if(S.claimIndex>=S.claimQueue.length){
      if(S.claimRound>=6)return transitionToWar();
      S.claimRound++;
      return startClaimRound();
    }

    const p=currentClaimPlayer();
    S.order=S.claimQueue;
    S.idx=S.claimIndex;
    humanMode='CLAIM';
    render();

    if(p==='R'){
      S.claimScheduled=false;
      return;
    }
    if(S.claimScheduled)return;
    S.claimScheduled=true;

    setTimeout(()=>{
      if(token!==runToken||!S||S.phase!=='CLAIM')return;
      S.claimScheduled=false;
      const id=botChooseClaim(p);
      if(id!=null){
        S.owners[id]=p;
        log(p+' осваивает остров '+id+' (★'+lv(id)+').');
      }
      S.claimIndex++;
      advanceClaimQueue();
    },180);
  }

  function startClaimRound(){
    if(!S||S.phase!=='CLAIM')return;
    const rank=shuffle(PLAYERS);
    S.claimRank=rank;
    S.claimQueue=[...rank,rank[0],rank[1]];
    S.claimIndex=0;
    S.claimScheduled=false;
    S.order=S.claimQueue;
    S.idx=0;
    log('— Освоение '+S.claimRound+'/6. Порядок: '+rank.join(' → ')+'. Первые двое получают второй захват.');
    advanceClaimQueue();
  }

  function transitionToWar(){
    const unclaimed=[];
    for(let i=1;i<=36;i++)if(!S.owners[i])unclaimed.push(i);
    if(unclaimed.length){
      for(const id of unclaimed){
        const counts={R:0,B:0,G:0,P:0};
        for(const owner of Object.values(S.owners))if(counts[owner]!=null)counts[owner]++;
        const p=PLAYERS.slice().sort((a,b)=>counts[a]-counts[b])[0];
        S.owners[id]=p;
      }
    }

    S.phase='WAR';
    S.round=1;
    S.order=S.orders[0];
    S.idx=0;
    humanMode='ATTACK';
    secretArmed=false;
    log('⚔ Освоение завершено. Начинается война: 8 раундов.');
    render();
    setTimeout(advanceUntilHuman,220);
  }

  newGame=function(){
    runToken++;
    const orders=Array.from({length:8},()=>shuffle(PLAYERS));
    S={
      phase:'CLAIM',
      claimRound:1,
      claimRank:[],
      claimQueue:[],
      claimIndex:0,
      claimScheduled:false,
      round:1,
      orders:orders,
      order:[],
      idx:0,
      owners:{},
      bases:{A:3,B:3,C:3,D:3},
      captured:{A:null,B:null,C:null,D:null},
      players:{},
      finished:false
    };
    PLAYERS.forEach(p=>S.players[p]=playerState());
    humanMode='CLAIM';
    secretArmed=false;
    pending=null;
    qctx=null;
    $('log').innerHTML='';
    log('Новая партия без флагмана. Сначала — стадия освоения территорий.');
    startClaimRound();
    if(window.resetMapView)setTimeout(window.resetMapView,40);
  };

  canUpgrade=function(){return false;};
  moveHuman=function(){};
  botUpgrade=function(){};
  botPostMove=function(){};
  humanEndAfterPost=function(){};

  statusText=function(){
    if(!S)return '';
    if(S.phase==='CLAIM'){
      const p=currentClaimPlayer();
      return p==='R'?'Освоение: выбери доступный нейтральный остров':'Освоение: ход '+p+'…';
    }
    if(S.finished)return 'Игра окончена. Красные: '+fame('R')+' славы.';
    const p=S.order[S.idx];
    if(p!=='R')return 'Ход '+p+'…';
    return secretArmed?'Тайный путь активен: выбери любую вражескую цель.':'Выбери соседнюю вражескую территорию или базу.';
  };

  beginHumanAttack=function(target){
    if(!S||S.phase!=='WAR'||humanMode!=='ATTACK'||S.finished)return;
    const legal=legalTargets('R',secretArmed);
    if(!legal.includes(target)){
      log('Эта цель сейчас недоступна.');
      return;
    }
    const useSecret=secretArmed;
    if(useSecret){
      S.players.R.secret--;
      secretArmed=false;
      log('Использован Тайный путь.');
    }
    pending={attacker:'R',target:target,secret:useSecret};
    log('Атака: '+target+'.');
    startDuel();
  };

  applyDuel=function(w){
    if(!pending)return;
    if(w==='DEFENDER'){
      log('Защитник отбил атаку на '+pending.target+'.');
      return finishBattle();
    }

    const target=pending.target;
    const att=pending.attacker;

    if(typeof target==='string'){
      S.bases[target]--;
      log('База '+target+': разрушен слой, осталось '+S.bases[target]+'.');
      if(S.bases[target]<=0){
        S.bases[target]=0;
        S.captured[target]=att;
        S.players[att].flags++;
        log('🏴 '+att+' захватывает флаг базы '+target+' (+9 славы).');
        return finishBattle();
      }
      render();
      return setTimeout(startDuel,260);
    }

    S.owners[target]=att;
    S.players[att].coins+=10;
    log(att+' захватывает остров '+target+' (+10 монет).');
    finishBattle();
  };

  finishBattle=function(){
    if(!pending)return;
    pending=null;
    humanMode='ATTACK';
    endCurrentTurn();
  };

  botTurn=function(p){
    if(!S||S.phase!=='WAR'||S.finished)return;
    const normal=legalTargets(p,false);
    let target=null;
    let useSecret=false;
    const bases=normal.filter(x=>typeof x==='string');

    if(bases.length&&Math.random()<.65){
      target=bases[Math.floor(Math.random()*bases.length)];
    }
    if(target==null&&normal.length){
      const sorted=[...normal].sort((a,b)=>{
        const va=typeof a==='number'?lv(a):4;
        const vb=typeof b==='number'?lv(b):4;
        return vb-va;
      });
      target=sorted[0];
    }
    if(target==null&&S.players[p].secret>0){
      const all=legalTargets(p,true).filter(x=>typeof x==='string');
      if(all.length){
        target=all[Math.floor(Math.random()*all.length)];
        useSecret=true;
        S.players[p].secret--;
      }
    }
    if(target==null){
      log(p+' пропускает атаку.');
      return endCurrentTurn();
    }

    pending={attacker:p,target:target,secret:useSecret};
    log(p+' атакует '+target+(useSecret?' Тайным путём':'')+'.');
    startDuel();
  };

  endCurrentTurn=function(){
    if(!S||S.phase!=='WAR'||S.finished)return;
    S.idx++;
    if(S.idx>=S.order.length){
      if(S.round>=8){
        S.finished=true;
        render();
        showFinal();
        return;
      }
      S.round++;
      S.order=S.orders[S.round-1];
      S.idx=0;
      log('— Раунд '+S.round+'.');
    }
    render();
    setTimeout(advanceUntilHuman,260);
  };

  advanceUntilHuman=function(){
    if(!S||S.finished)return;
    if(S.phase==='CLAIM')return advanceClaimQueue();
    const p=S.order[S.idx];
    if(p==='R'){
      humanMode='ATTACK';
      render();
    }else{
      botTurn(p);
    }
  };

  showFinal=function(){
    const arr=PLAYERS.map(p=>[p,fame(p)]).sort((a,b)=>b[1]-a[1]);
    alert('Финал\\n'+arr.map(([p,s],i)=>(i+1)+'. '+p+': '+s).join('\\n'));
  };

  render=function(){
    legacyRender();
    if(!S)return;

    document.body.dataset.phase=S.phase||'WAR';

    document.querySelectorAll('#map [data-id]').forEach(el=>{
      const id=Number(el.dataset.id);
      const owner=S.owners[id];
      el.classList.toggle('neutral',!owner);
      el.classList.remove('claimable');
      el.style.setProperty('--owner',owner?COLORS[owner]:neutralColor);
      const label=el.querySelector('.islandNo,small');
      if(label)label.textContent='#'+id+' · ★'+lv(id);
    });

    document.querySelectorAll('[data-base]').forEach(el=>{
      const b=el.dataset.base;
      let meta=el.querySelector('.baseMeta');
      if(!meta){
        meta=document.createElement('span');
        meta.className='baseMeta';
        el.appendChild(meta);
      }
      meta.textContent=S.phase==='CLAIM'
        ?'База '+b
        :'База '+b+' · 🛡'+S.bases[b]+' · 🏴9';
      el.classList.toggle('legal',S.phase==='WAR'&&S.order[S.idx]==='R'&&humanMode==='ATTACK'&&legalTargets('R',secretArmed).includes(b));
    });

    if(S.phase==='CLAIM'){
      $('roundV').textContent='Освоение '+S.claimRound+'/6';
      const p=currentClaimPlayer();
      $('status').textContent=p==='R'
        ?'Твой захват · выбери подсвеченный остров'
        :'Освоение · ход '+p+'…';
      $('modeBtn').textContent=p==='R'?'Выбери остров':'Ожидание…';
      $('modeBtn').disabled=true;
      $('secretBtn').classList.remove('on');

      if(p==='R'){
        for(const id of claimFront('R')){
          const el=document.querySelector('#map [data-id="'+id+'"]');
          if(el)el.classList.add('claimable');
        }
      }
    }else{
      $('roundV').textContent=S.finished?'Финал':'Раунд '+S.round+'/8';
      $('status').textContent=statusText();
      $('modeBtn').textContent=S.order[S.idx]==='R'?'⚔ Выбери цель':'Ход соперника';
      $('modeBtn').disabled=true;
    }

    $('coinsV').textContent=S.players.R.coins;
    $('fameV').textContent=fame('R');
  };

  const css=document.createElement('style');
  css.textContent=[
    '#shipPanelBtn,#shipPanel,#homeBtn,.ship{display:none!important}',
    'body[data-phase="CLAIM"] #secretBtn,body[data-phase="CLAIM"] #rightBoosts,body[data-phase="CLAIM"] .turnBoard{display:none!important}',
    '.tile.neutral .islandArt{opacity:.58!important;filter:saturate(.42) sepia(.18) contrast(.9)!important}',
    '.tile.claimable{outline:3px solid rgba(246,211,119,.96)!important;outline-offset:5px!important;border-radius:16px!important}',
    '.tile.claimable .islandArt{opacity:1!important;filter:saturate(.82) sepia(.04) contrast(.98) drop-shadow(0 0 4px rgba(255,235,172,.72))!important}',
    'body[data-phase="CLAIM"] .bottomHud{justify-content:flex-end!important}',
    'body[data-phase="CLAIM"] .actionBtn{min-width:145px!important}'
  ].join('');
  document.head.appendChild(css);

  document.addEventListener('click',function(e){
    if(!S||S.phase!=='CLAIM')return;
    const tile=e.target.closest('#map [data-id]');
    if(!tile)return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    if(currentClaimPlayer()!=='R')return;
    const id=Number(tile.dataset.id);
    claimIsland('R',id);
  },true);

  document.querySelectorAll('[data-base]').forEach(el=>{
    el.addEventListener('click',function(e){
      if(S&&S.phase==='CLAIM'){
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    },true);
  });

  $('modeBtn').onclick=function(){};
  $('homeBtn').onclick=function(){};
  $('hpBtn').onclick=function(){};
  $('dmgBtn').onclick=function(){};
  $('shipPanelBtn').onclick=function(){};
  $('secretBtn').onclick=function(){
    if(!S||S.phase!=='WAR'||S.order[S.idx]!=='R'||humanMode!=='ATTACK'||S.players.R.secret<=0||S.finished)return;
    secretArmed=!secretArmed;
    render();
  };
  $('newBtn').onclick=function(){newGame();};

  newGame();
})();