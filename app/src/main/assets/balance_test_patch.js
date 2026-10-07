'use strict';
(function(){
  const nativeRandom=Math.random.bind(Math);
  let activeSeed=0,activeRng=null,activeAttackKey=null,activeAttackContext=null;

  function toSeed(value){
    let n=Number(value);
    if(!Number.isFinite(n))n=0;
    n=(Math.floor(Math.abs(n))>>>0);
    return n||1;
  }
  function freshSeed(){
    return toSeed((Date.now()>>>0)^(Math.floor(nativeRandom()*0xffffffff)>>>0));
  }
  function mulberry32(seed){
    let a=seed>>>0;
    return function(){
      a=(a+0x6D2B79F5)>>>0;
      let t=a;
      t=Math.imul(t^(t>>>15),t|1);
      t^=t+Math.imul(t^(t>>>7),t|61);
      return ((t^(t>>>14))>>>0)/4294967296;
    };
  }
  function installSeed(seed){
    activeSeed=toSeed(seed);
    activeRng=mulberry32(activeSeed);
    Math.random=function(){return activeRng();};
  }

  function blankPlayerStats(){
    return {
      attacks:0,attackWins:0,defenses:0,defenseWins:0,duels:0,
      islandsCaptured:{1:0,2:0,3:0},basesCaptured:0,
      coinsEarned:0,coinsSpent:0,hpRepairs:0,hpUpgrades:0,dmgUpgrades:0,
      secretUsed:0,shipsSunk:0,timesSunk:0
    };
  }
  function makeMetrics(seed,owners,orders){
    const byPlayer={};PLAYERS.forEach(p=>byPlayer[p]=blankPlayerStats());
    return {
      version:'balance-test-v1',
      seed:seed,
      startedAt:new Date().toISOString(),
      rules:{
        rounds:8,islandCoinReward:10,baseFlagFame:9,hpCost:20,dmgCost:30,
        destroyedFlagship:'returns to own base at 0 HP and cannot move/support until repaired to at least 1 HP'
      },
      startOwners:Object.assign({},owners),
      roundOrders:orders.map(x=>x.slice()),
      byPlayer:byPlayer,
      human:{mcqAnswered:0,mcqCorrect:0,numericAnswered:0,numericAbsErrorTotal:0},
      events:[]
    };
  }
  function event(type,data,ctx){
    if(!S||!S.metrics)return;
    S.metrics.events.push(Object.assign({
      round:ctx&&ctx.round!=null?ctx.round:S.round,
      turn:ctx&&ctx.turn!=null?ctx.turn:S.idx,
      type:type
    },data||{}));
  }
  function pstats(p){return S&&S.metrics&&S.metrics.byPlayer?S.metrics.byPlayer[p]:null;}

  function hideFinal(){
    const el=document.getElementById('balanceFinalOverlay');
    if(el)el.classList.remove('show');
  }

  newGame=function(seedArg){
    const seed=seedArg==null?freshSeed():toSeed(seedArg);
    installSeed(seed);
    const orders=Array.from({length:8},()=>shuffle(PLAYERS));
    const owners=initialOwners();
    S={
      round:1,orders:orders,order:orders[0],idx:0,owners:owners,
      bases:{A:3,B:3,C:3,D:3},captured:{A:null,B:null,C:null,D:null},
      players:{},finished:false,seed:seed
    };
    PLAYERS.forEach(p=>{
      S.players[p]={coins:20,flags:0,ship:{hp:3,maxHp:3,dmg:1,pos:BASE[p],sunk:false},secret:1};
    });
    S.metrics=makeMetrics(seed,owners,orders);
    humanMode='MOVE';secretArmed=false;pending=null;qctx=null;
    activeAttackKey=null;activeAttackContext=null;
    $('log').innerHTML='';
    hideFinal();
    log('Баланс-тест · seed '+seed+'. Порядок ходов на 8 раундов зафиксирован.');
    render();
    if(window.resetMapView)window.resetMapView();
    advanceUntilHuman();
  };

  const previousRender=render;
  render=function(){
    previousRender();
    if(!S||!S.players)return;

    const sh=S.players.R.ship;
    $('shipV').textContent=sh.hp+'/'+sh.maxHp+' HP · '+sh.dmg;
    $('hpBtn').textContent=sh.hp<sh.maxHp?'Ремонт +1 HP · 20':'+ Макс. HP · 20';
    $('dmgBtn').textContent='+ Урон · 30';

    if(S.order[S.idx]==='R'&&humanMode==='MOVE'&&sh.hp<=0&&!S.finished){
      $('status').textContent='Флагман уничтожен · отремонтируй минимум до 1 HP';
    }

    document.querySelectorAll('#map [data-id]').forEach(el=>{
      const id=Number(el.dataset.id),small=el.querySelector('.islandNo,small');
      if(small)small.textContent='#'+id+' · ★'+lv(id);
      el.title='Остров '+id+' · '+lv(id)+' славы · владелец '+S.owners[id];
    });

    ['A','B','C','D'].forEach(b=>{
      const el=document.querySelector('[data-base="'+b+'"]');
      if(!el)return;
      let meta=el.querySelector('.baseMeta');
      if(!meta){meta=document.createElement('span');meta.className='baseMeta';el.appendChild(meta);}
      const owner=OWNER_BASE[b],ship=S.players[owner].ship;
      let txt='База '+b+' · 🛡'+S.bases[b]+' · 🏴9';
      if(S.captured[b])txt='База '+b+' · флаг у '+S.captured[b];
      if(ship.pos===b)txt+=' · 🚢'+ship.hp+'/'+ship.maxHp;
      meta.textContent=txt;
      el.title=txt;
    });

    const badge=document.getElementById('balanceSeedBadge');
    if(badge)badge.textContent='TEST · seed '+S.seed;
  };

  canUpgrade=function(kind){
    if(S.finished||S.order[S.idx]!=='R'||humanMode!=='MOVE')return false;
    const p=S.players.R,sh=p.ship,atBase=sh.pos==='A';
    if(!atBase)return false;
    if(kind==='hp')return p.coins>=20&&(sh.hp<sh.maxHp||sh.maxHp<5);
    return p.coins>=30&&sh.dmg<2&&sh.hp>0&&!sh.sunk;
  };

  $('hpBtn').onclick=function(){
    if(!canUpgrade('hp'))return;
    const p=S.players.R,sh=p.ship,st=pstats('R');
    p.coins-=20;if(st)st.coinsSpent+=20;
    if(sh.hp<sh.maxHp){
      sh.hp++;
      if(sh.hp>=1)sh.sunk=false;
      if(st)st.hpRepairs++;
      event('ship_repair',{player:'R',hp:sh.hp,maxHp:sh.maxHp,cost:20});
      log('Ремонт флагмана: '+sh.hp+'/'+sh.maxHp+' HP.');
    }else{
      sh.maxHp++;sh.hp++;
      if(st)st.hpUpgrades++;
      event('hp_upgrade',{player:'R',hp:sh.hp,maxHp:sh.maxHp,cost:20});
      log('Корпус улучшен: максимум '+sh.maxHp+' HP.');
    }
    render();
  };
  $('dmgBtn').onclick=function(){
    if(!canUpgrade('dmg'))return;
    const p=S.players.R,st=pstats('R');
    p.coins-=30;p.ship.dmg++;
    if(st){st.coinsSpent+=30;st.dmgUpgrades++;}
    event('dmg_upgrade',{player:'R',damage:p.ship.dmg,cost:30});
    log('Пушки улучшены: урон '+p.ship.dmg+'.');
    render();
  };

  botUpgrade=function(p){
    const x=S.players[p],sh=x.ship,st=pstats(p);
    if(sh.pos!==BASE[p])return;
    if(sh.hp<sh.maxHp&&x.coins>=20){
      x.coins-=20;sh.hp++;if(sh.hp>=1)sh.sunk=false;
      if(st){st.coinsSpent+=20;st.hpRepairs++;}
      event('ship_repair',{player:p,hp:sh.hp,maxHp:sh.maxHp,cost:20});
      return;
    }
    if(sh.hp<=0||sh.sunk)return;
    if(x.coins>=30&&sh.dmg<2){
      x.coins-=30;sh.dmg++;
      if(st){st.coinsSpent+=30;st.dmgUpgrades++;}
      event('dmg_upgrade',{player:p,damage:sh.dmg,cost:30});
      return;
    }
    if(x.coins>=20&&sh.maxHp<5){
      x.coins-=20;sh.maxHp++;sh.hp++;
      if(st){st.coinsSpent+=20;st.hpUpgrades++;}
      event('hp_upgrade',{player:p,hp:sh.hp,maxHp:sh.maxHp,cost:20});
    }
  };

  botTurn=function(p){
    const sh=S.players[p].ship;
    if(sh.hp<=0){sh.hp=0;sh.sunk=true;sh.pos=BASE[p];}
    botUpgrade(p);
    let normal=legalTargets(p,false),target=null,useSecret=false;
    let bases=normal.filter(x=>typeof x==='string');
    if(bases.length&&Math.random()<.65)target=bases[Math.floor(Math.random()*bases.length)];
    if(target==null&&normal.length){
      normal.sort((a,b)=>(typeof b==='number'?lv(b):4)-(typeof a==='number'?lv(a):4));
      target=normal[0];
    }
    if(target==null&&S.players[p].secret>0){
      let all=legalTargets(p,true).filter(x=>typeof x==='string');
      if(all.length){target=all[Math.floor(Math.random()*all.length)];useSecret=true;S.players[p].secret--;}
    }
    if(target==null){log(p+' пропускает атаку.');botPostMove(p);return endCurrentTurn();}
    if(!useSecret){
      let source=(adj[target]||[]).find(n=>typeof n==='number'&&S.owners[n]===p);
      if(source!=null&&!sh.sunk&&sh.hp>0)sh.pos=source;
    }
    pending={attacker:p,target:target,secret:useSecret};
    log(p+' атакует '+target+(useSecret?' Тайным путём':'')+'.');
    startDuel();
  };

  advanceUntilHuman=function(){
    if(S.finished)return;
    const p=S.order[S.idx];
    if(p==='R'){
      const sh=S.players.R.ship;
      if(sh.hp<=0){sh.hp=0;sh.sunk=true;sh.pos='A';}
      humanMode='MOVE';
      render();
    }else botTurn(p);
  };

  const oldStartDuel=startDuel;
  startDuel=function(){
    if(pending&&S&&S.metrics){
      const def=typeof pending.target==='string'?OWNER_BASE[pending.target]:S.owners[pending.target];
      const key=[S.round,S.idx,pending.attacker,String(pending.target)].join(':');
      if(activeAttackKey!==key){
        activeAttackKey=key;
        activeAttackContext={key:key,round:S.round,turn:S.idx,attacker:pending.attacker,target:pending.target,defender:def,secret:!!pending.secret};
        const a=pstats(pending.attacker),d=pstats(def);
        if(a)a.attacks++;
        if(d)d.defenses++;
        if(pending.secret&&a)a.secretUsed++;
        event('attack_start',{attacker:pending.attacker,defender:def,target:pending.target,secret:!!pending.secret},activeAttackContext);
      }
    }
    return oldStartDuel();
  };

  const oldFinishBattle=finishBattle;
  finishBattle=function(){
    const out=oldFinishBattle();
    activeAttackKey=null;activeAttackContext=null;
    return out;
  };

  const oldApplyDuel=applyDuel;
  applyDuel=function(winner){
    if(!pending)return oldApplyDuel(winner);
    const ctx=activeAttackContext||{
      round:S.round,turn:S.idx,attacker:pending.attacker,target:pending.target,
      defender:typeof pending.target==='string'?OWNER_BASE[pending.target]:S.owners[pending.target],
      secret:!!pending.secret
    };
    const target=pending.target,att=pending.attacker,def=ctx.defender;
    const beforeOwner=typeof target==='number'?S.owners[target]:null;
    const beforeCaptured=typeof target==='string'?S.captured[target]:null;
    const beforeHp={};PLAYERS.forEach(p=>beforeHp[p]=S.players[p].ship.hp);

    const a=pstats(att);if(a)a.duels++;
    event('duel',{attacker:att,defender:def,target:target,winner:winner},ctx);
    const result=oldApplyDuel(winner);

    PLAYERS.forEach(p=>{
      const sh=S.players[p].ship;
      if(beforeHp[p]>0&&sh.hp===0){
        sh.sunk=true;sh.pos=BASE[p];
        const sunkStats=pstats(p),killer=pstats(att);
        if(sunkStats)sunkStats.timesSunk++;
        if(p!==att&&killer)killer.shipsSunk++;
        event('ship_sunk',{player:p,by:att,base:BASE[p]},ctx);
        render();
      }
    });

    if(winner==='DEFENDER'){
      const ds=pstats(def);if(ds)ds.defenseWins++;
      event('attack_end',{attacker:att,defender:def,target:target,result:'defended'},ctx);
    }else if(typeof target==='number'&&beforeOwner!==att&&S.owners[target]===att){
      if(a){a.attackWins++;a.islandsCaptured[lv(target)]++;a.coinsEarned+=10;}
      event('attack_end',{attacker:att,defender:def,target:target,result:'island_captured',level:lv(target),coins:10},ctx);
    }else if(typeof target==='string'&&!beforeCaptured&&S.captured[target]===att){
      if(a){a.attackWins++;a.basesCaptured++;}
      event('attack_end',{attacker:att,defender:def,target:target,result:'base_captured',fame:9},ctx);
    }
    return result;
  };

  const oldHumanMcqAnswered=humanMcqAnswered;
  humanMcqAnswered=function(correct){
    if(S&&S.metrics){
      S.metrics.human.mcqAnswered++;
      if(correct)S.metrics.human.mcqCorrect++;
      event('human_mcq',{correct:!!correct,question:qctx&&qctx.q?qctx.q[0]:null});
    }
    return oldHumanMcqAnswered(correct);
  };

  const oldNumericSubmit=numericSubmit;
  numericSubmit=function(){
    if(qctx&&qctx.num){
      const v=parseFloat($('nInput').value);
      if(Number.isFinite(v)&&S&&S.metrics){
        const ans=qctx.num[1],err=Math.abs(v-ans);
        S.metrics.human.numericAnswered++;
        S.metrics.human.numericAbsErrorTotal+=err;
        event('human_numeric',{question:qctx.num[0],answer:v,correctAnswer:ans,absError:err});
      }
    }
    return oldNumericSubmit();
  };

  function territorySummary(p){
    let count=0,fameValue=0,levels={1:0,2:0,3:0};
    for(let i=1;i<=36;i++)if(S.owners[i]===p){count++;levels[lv(i)]++;fameValue+=lv(i);}
    return {count:count,fame:fameValue,levels:levels};
  }
  function buildReport(){
    const final={};
    PLAYERS.forEach(p=>{
      final[p]={
        fame:fame(p),coins:S.players[p].coins,flags:S.players[p].flags,
        ship:Object.assign({},S.players[p].ship),territories:territorySummary(p)
      };
    });
    return {
      version:S.metrics.version,seed:S.seed,startedAt:S.metrics.startedAt,endedAt:new Date().toISOString(),
      rules:S.metrics.rules,startOwners:S.metrics.startOwners,roundOrders:S.metrics.roundOrders,
      stats:S.metrics.byPlayer,human:S.metrics.human,final:final,
      finalBases:Object.assign({},S.bases),captured:Object.assign({},S.captured),
      events:S.metrics.events
    };
  }
  function reportText(){return JSON.stringify(buildReport(),null,2);}

  showFinal=function(){
    if(!S||!S.metrics)return;
    const overlay=document.getElementById('balanceFinalOverlay');
    const rows=document.getElementById('balanceFinalRows');
    const sorted=PLAYERS.map(p=>({p:p,score:fame(p)})).sort((a,b)=>b.score-a.score);
    rows.innerHTML='';
    sorted.forEach((x,i)=>{
      const p=x.p,t=territorySummary(p),st=pstats(p);
      const tr=document.createElement('tr');
      tr.innerHTML='<td>'+(i+1)+'</td><td><b>'+p+'</b></td><td><b>'+x.score+'</b></td><td>'+t.fame+'</td><td>'+S.players[p].flags+' × 9</td><td>'+S.players[p].coins+'</td><td>'+st.islandsCaptured[1]+'/'+st.islandsCaptured[2]+'/'+st.islandsCaptured[3]+'</td><td>'+st.attackWins+'/'+st.attacks+'</td><td>'+st.shipsSunk+'/'+st.timesSunk+'</td>';
      rows.appendChild(tr);
    });
    document.getElementById('balanceFinalSeed').value=String(S.seed);
    document.getElementById('balanceQuestionStats').textContent=
      'Вопросы игрока: '+S.metrics.human.mcqCorrect+'/'+S.metrics.human.mcqAnswered+
      ' MCQ · числовых '+S.metrics.human.numericAnswered;
    document.getElementById('balanceReportText').value=reportText();
    window.__balanceReport=buildReport();
    overlay.classList.add('show');
  };

  function mountUi(){
    const style=document.createElement('style');
    style.textContent=[
      '#balanceSeedBadge{position:absolute;z-index:32;left:14px;bottom:18px;padding:4px 7px;border-radius:8px;background:rgba(47,30,17,.72);border:1px solid rgba(193,156,91,.55);color:#f3dfb1;font:700 9px system-ui,sans-serif;pointer-events:auto}',
      '.islandNo{border-color:var(--owner)!important}.baseMeta{border-color:var(--baseColor)!important}',
      '#balanceFinalOverlay{z-index:90}.balanceFinalSheet{width:min(1040px,94vw);max-height:88vh}',
      '.balanceFinalTop{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}.balanceFinalTop input{width:150px;padding:8px;border-radius:8px;border:1px solid #947042;background:#fff7df;color:#2b1d11}',
      '.balanceTableWrap{overflow:auto}.balanceTable{width:100%;border-collapse:collapse;font-size:12px}.balanceTable th,.balanceTable td{padding:7px 8px;border-bottom:1px solid #9a774455;text-align:center;white-space:nowrap}.balanceTable th{font-size:10px;text-transform:uppercase;color:#654b2d}',
      '.balanceButtons{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.balanceButtons button{padding:9px 12px;border-radius:9px;border:1px solid #76572f;background:#51301c;color:#f9ebca;font-weight:800}',
      '#balanceReportText{width:100%;height:120px;resize:vertical;border:1px solid #967344;border-radius:9px;background:#fff8e7;color:#382615;padding:8px;font:10px ui-monospace,monospace}',
      '#balanceQuestionStats{margin:8px 0;font:700 11px system-ui,sans-serif;color:#654b2d}'
    ].join('');

    document.head.appendChild(style);

    const badge=document.createElement('button');
    badge.id='balanceSeedBadge';badge.type='button';badge.textContent='TEST';
    badge.onclick=function(){
      if(!S)return;
      const text=String(S.seed);
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).catch(()=>{});
      log('Seed '+text+' скопирован.');
    };
    $('app').appendChild(badge);

    const overlay=document.createElement('div');
    overlay.id='balanceFinalOverlay';overlay.className='overlay';
    overlay.innerHTML=[
      '<section class="sheet balanceFinalSheet">',
      '<h2>Итоги баланс-теста</h2>',
      '<div class="balanceFinalTop"><span class="subtle">Seed партии</span><input id="balanceFinalSeed" type="number" inputmode="numeric"><button id="balanceRunSeed" class="btn gold">Запустить seed</button></div>',
      '<div class="balanceTableWrap"><table class="balanceTable"><thead><tr><th>#</th><th>Игрок</th><th>Слава</th><th>Острова ★</th><th>Флаги</th><th>Монеты</th><th>Захваты L1/L2/L3</th><th>Победы/атаки</th><th>Потопил/потоплен</th></tr></thead><tbody id="balanceFinalRows"></tbody></table></div>',
      '<div id="balanceQuestionStats"></div>',
      '<div class="balanceButtons"><button id="balanceRepeat">Повторить этот seed</button><button id="balanceNew">Новый seed</button><button id="balanceCopy">Копировать отчёт</button><button id="balanceClose">Посмотреть карту</button></div>',
      '<textarea id="balanceReportText" readonly></textarea>',
      '</section>'
    ].join('');
    document.body.appendChild(overlay);

    document.getElementById('balanceRepeat').onclick=function(){newGame(S.seed);};
    document.getElementById('balanceNew').onclick=function(){newGame();};
    document.getElementById('balanceRunSeed').onclick=function(){newGame(document.getElementById('balanceFinalSeed').value);};
    document.getElementById('balanceClose').onclick=hideFinal;
    document.getElementById('balanceCopy').onclick=function(){
      const ta=document.getElementById('balanceReportText'),txt=ta.value;
      const fallback=()=>{ta.focus();ta.select();try{document.execCommand('copy');}catch(e){}};
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).catch(fallback);else fallback();
    };

    $('newBtn').onclick=function(){newGame();};
  }

  mountUi();
  newGame();
})();