'use strict';

const PLAYERS=['R','B','G','P'];
const BASE={R:'A',B:'B',G:'C',P:'D'};
const OWNER_BASE={A:'R',B:'B',C:'G',D:'P'};
const COLORS={R:'#ef5a50',B:'#4c91ff',G:'#43c279',P:'#b46cff'};
const NAMES={R:'Красные',B:'Синие',G:'Зелёные',P:'Фиолетовые'};
const L2=new Set([3,4,8,9,11,17,20,26,28,33]);
const L3=new Set([10,14,15,16,21,22,23,27]);
const lv=i=>L3.has(i)?3:L2.has(i)?2:1;

const adj={};
for(let i=1;i<=36;i++)adj[i]=[];
for(const b of ['A','B','C','D'])adj[b]=[];
const link=(a,b)=>{adj[a].push(b);adj[b].push(a);};
for(let r=0;r<6;r++)for(let c=0;c<6;c++){const i=r*6+c+1;if(c<5)link(i,i+1);if(r<5)link(i,i+6);}
link(15,22);link(16,21);
for(const [b,ids] of Object.entries({A:[1,2,7],B:[5,6,12],C:[25,31,32],D:[30,35,36]}))for(const i of ids)link(b,i);

const MCQ=[
 ['Какая планета ближе всего к Солнцу?',['Венера','Земля','Меркурий','Марс'],2],
 ['Столица Канады?',['Торонто','Оттава','Монреаль','Ванкувер'],1],
 ['Какой элемент имеет символ Ag?',['Золото','Серебро','Аргон','Алюминий'],1],
 ['Какой океан самый большой?',['Атлантический','Индийский','Тихий','Северный Ледовитый'],2],
 ['Сколько планет в Солнечной системе?',['7','8','9','10'],1],
 ['Какой газ преобладает в атмосфере Земли?',['Кислород','Азот','Водород','Аргон'],1],
 ['Какой металл обозначается Fe?',['Медь','Железо','Олово','Серебро'],1],
 ['Столица Австралии?',['Сидней','Канберра','Мельбурн','Перт'],1],
 ['Сколько спутников у Марса?',['1','2','3','4'],1],
 ['Какой элемент обозначается K?',['Кальций','Калий','Кобальт','Кремний'],1],
 ['Кто написал «Войну и мир»?',['Достоевский','Толстой','Чехов','Пушкин'],1],
 ['Какой материк самый большой?',['Африка','Европа','Азия','Южная Америка'],2],
 ['Столица Японии?',['Осака','Киото','Токио','Нагоя'],2],
 ['Сколько сторон у шестиугольника?',['5','6','7','8'],1],
 ['Как называется процесс превращения воды в пар?',['Конденсация','Испарение','Замерзание','Сублимация'],1]
];
const NUMS=[
 ['В каком году человек впервые высадился на Луне?',1969],
 ['Сколько минут в сутках?',1440],
 ['Сколько километров примерно в земном экваторе?',40075],
 ['В каком году началась Вторая мировая война?',1939],
 ['Сколько костей обычно у взрослого человека?',206],
 ['Сколько стран-членов было в ООН при её основании?',51],
 ['Высота Эвереста в метрах примерно?',8849],
 ['Сколько элементов в современной периодической таблице?',118]
];

const $=id=>document.getElementById(id);
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

let S=null;
let pending=null;
let secretArmed=false;
let interactionLocked=false;
let runId=0;
let questionTimerSeq=0;
let questionFrame=0;
let activeQuestion=null;

const HUMAN_QUESTION_MS=20000;
const BOT_THINK_MIN=2500;
const BOT_THINK_MAX=4500;
const ANSWER_REVEAL_MS=3000;
const NUMERIC_REORDER_DELAY=900;
const NUMERIC_RANKED_HOLD=2400;

function randomMs(min,max){return min+Math.floor(Math.random()*(max-min+1));}
function log(t){const el=$('log');if(!el)return;const d=document.createElement('div');d.textContent=t;el.prepend(d);}
function playerState(){return{coins:20,flags:0,secret:1,defenseFame:0};}
function baseVisualOwner(b){return S&&S.captured[b]?S.captured[b]:OWNER_BASE[b];}

function fame(p){
  if(!S)return 0;
  let v=S.players[p].flags*9+(S.players[p].defenseFame||0);
  for(let i=1;i<=36;i++)if(S.owners[i]===p)v+=lv(i);
  return v;
}

function ownAdj(p,target){
  return (adj[target]||[]).some(n=>typeof n==='number'&&S.owners[n]===p);
}
function legalTargets(p,secret=false){
  const arr=[];
  for(let i=1;i<=36;i++)if(S.owners[i]!==p&&(secret||ownAdj(p,i)))arr.push(i);
  for(const b of ['A','B','C','D']){
    if(OWNER_BASE[b]===p||S.captured[b])continue;
    if(secret||ownAdj(p,b))arr.push(b);
  }
  return arr;
}
function defenderFor(target){
  return typeof target==='string'?OWNER_BASE[target]:S.owners[target];
}
function targetLabel(target){
  return typeof target==='string'?'база '+target:'остров '+target+' (★'+lv(target)+')';
}

function claimFront(p){
  const out=new Set();
  for(const n of adj[BASE[p]])if(typeof n==='number'&&!S.owners[n])out.add(n);
  for(let i=1;i<=36;i++){
    if(S.owners[i]!==p)continue;
    for(const n of adj[i])if(typeof n==='number'&&!S.owners[n])out.add(n);
  }
  if(!out.size)for(let i=1;i<=36;i++)if(!S.owners[i])out.add(i);
  return [...out];
}
function currentClaimPlayer(){
  if(!S||S.phase!=='CLAIM')return null;
  return S.claimQueue[S.claimIndex]||null;
}
function botClaimChoice(p){
  const choices=claimFront(p);
  if(!choices.length)return null;
  const max=Math.max(...choices.map(lv));
  const best=choices.filter(id=>lv(id)===max);
  return best[Math.floor(Math.random()*best.length)];
}
function startClaimRound(){
  if(!S||S.phase!=='CLAIM')return;
  const plan=S.claimOrders[S.claimRound-1];
  S.claimRank=plan.rank;
  S.claimQueue=plan.queue;
  S.claimIndex=0;
  log('Освоение '+S.claimRound+'/6: '+plan.rank.map(p=>NAMES[p]).join(' → '));
  render();
  advanceClaim();
}
async function advanceClaim(){
  const token=runId;
  if(!S||S.phase!=='CLAIM'||interactionLocked)return;
  if(S.claimIndex>=S.claimQueue.length){
    if(S.claimRound>=6)return transitionToWar();
    S.claimRound++;
    return startClaimRound();
  }
  const p=currentClaimPlayer();
  render();
  if(p==='R')return;

  interactionLocked=true;
  await sleep(650);
  if(token!==runId||!S||S.phase!=='CLAIM')return;
  const id=botClaimChoice(p);
  if(id!=null){
    S.owners[id]=p;
    log(NAMES[p]+' осваивают остров '+id+'.');
  }
  S.claimIndex++;
  interactionLocked=false;
  render();
  advanceClaim();
}
function humanClaim(id){
  if(!S||S.phase!=='CLAIM'||interactionLocked||currentClaimPlayer()!=='R'||S.owners[id])return;
  if(!claimFront('R').includes(id))return;
  S.owners[id]='R';
  log('Красные осваивают остров '+id+'.');
  S.claimIndex++;
  render();
  advanceClaim();
}
function transitionToWar(){
  if(!S)return;
  const neutral=[];
  for(let i=1;i<=36;i++)if(!S.owners[i])neutral.push(i);
  for(const id of neutral){
    const counts=Object.fromEntries(PLAYERS.map(p=>[p,0]));
    Object.values(S.owners).forEach(p=>{if(p in counts)counts[p]++;});
    const p=PLAYERS.slice().sort((a,b)=>counts[a]-counts[b])[0];
    S.owners[id]=p;
  }
  S.phase='WAR';
  S.round=1;
  S.idx=0;
  S.order=S.orders[0];
  secretArmed=false;
  log('Начинается война.');
  render();
  setTimeout(advanceWar,450);
}

function newGame(){
  runId++;
  stopQuestionTimer();
  interactionLocked=false;
  pending=null;
  activeQuestion=null;
  secretArmed=false;
  $('questionOverlay').classList.remove('show');
  $('finalOverlay').classList.remove('show');
  S={
    phase:'CLAIM',
    claimRound:1,claimRank:[],claimQueue:[],claimIndex:0,
    claimOrders:Array.from({length:6},()=>{
      const rank=shuffle(PLAYERS);
      return{rank,queue:[...rank,rank[0],rank[1]]};
    }),
    round:1,orders:Array.from({length:8},()=>shuffle(PLAYERS)),order:[],idx:0,
    owners:{},bases:{A:3,B:3,C:3,D:3},captured:{A:null,B:null,C:null,D:null},
    players:{},finished:false
  };
  PLAYERS.forEach(p=>S.players[p]=playerState());
  $('log').innerHTML='';
  startClaimRound();
  if(window.fitPirateMap)setTimeout(window.fitPirateMap,50);
}

async function advanceWar(){
  if(!S||S.phase!=='WAR'||S.finished||interactionLocked)return;
  const p=S.order[S.idx];
  render();
  if(p==='R')return;

  interactionLocked=true;
  await sleep(700);
  if(!S||S.phase!=='WAR'||S.finished)return;

  const normal=legalTargets(p,false);
  let target=null,useSecret=false;
  const bases=normal.filter(x=>typeof x==='string');
  if(bases.length&&Math.random()<.5)target=bases[Math.floor(Math.random()*bases.length)];
  if(target==null&&normal.length){
    const scored=[...normal].sort((a,b)=>{
      const va=typeof a==='number'?lv(a):4;
      const vb=typeof b==='number'?lv(b):4;
      return vb-va;
    });
    target=scored[0];
  }
  if(target==null&&S.players[p].secret>0){
    const all=legalTargets(p,true);
    if(all.length){
      target=all[Math.floor(Math.random()*all.length)];
      useSecret=true;
      S.players[p].secret--;
    }
  }
  if(target==null){
    log(NAMES[p]+' пропускают ход.');
    interactionLocked=false;
    return endTurn();
  }
  pending={attacker:p,target,secret:useSecret};
  render();
  await startDuel();
}

function humanAttack(target){
  if(!S||S.phase!=='WAR'||S.finished||interactionLocked||S.order[S.idx]!=='R')return;
  const legal=legalTargets('R',secretArmed);
  if(!legal.includes(target))return;
  const useSecret=secretArmed;
  if(useSecret){S.players.R.secret--;secretArmed=false;}
  pending={attacker:'R',target,secret:useSecret};
  interactionLocked=true;
  render();
  startDuel();
}

async function startDuel(){
  if(!pending)return;
  const def=defenderFor(pending.target);
  const humanInvolved=pending.attacker==='R'||def==='R';
  if(humanInvolved)return askHumanMcq(def);
  return botVsBotMcq(def);
}

function stopQuestionTimer(reset=true){
  questionTimerSeq++;
  if(questionFrame)cancelAnimationFrame(questionFrame);
  questionFrame=0;
  const fill=$('questionTimerFill');
  if(fill&&reset)fill.style.transform='scaleX(1)';
}
function animateTimer(ms,onExpire){
  stopQuestionTimer(true);
  const seq=questionTimerSeq;
  const start=performance.now();
  const fill=$('questionTimerFill');
  function tick(now){
    if(seq!==questionTimerSeq)return;
    const left=Math.max(0,1-(now-start)/ms);
    if(fill)fill.style.transform='scaleX('+left+')';
    if(left<=0){questionFrame=0;questionTimerSeq++;onExpire();return;}
    questionFrame=requestAnimationFrame(tick);
  }
  questionFrame=requestAnimationFrame(tick);
}
function clearQuestionUi(){
  $('qText').textContent='';
  $('answers').innerHTML='';
  $('answers').style.display='grid';
  $('numericBox').style.display='none';
  $('nInput').value='';
  $('battleResult').textContent='';
}
function wrongChoiceIndex(q){
  const arr=[0,1,2,3].filter(i=>i!==q[2]);
  return arr[Math.floor(Math.random()*arr.length)];
}
function botChoiceIndex(q){
  return Math.random()<.62?q[2]:wrongChoiceIndex(q);
}
function revealMcq(q,attackerChoice,defenderChoice,defender){
  const buttons=[...$('answers').children];
  const sameChoice=attackerChoice!=null&&defenderChoice!=null&&attackerChoice===defenderChoice;
  buttons.forEach((b,i)=>{
    b.disabled=true;
    b.classList.remove('attackerFull','defenderFull','samePick','correctReveal');
    b.style.removeProperty('--attacker-color');
    b.style.removeProperty('--defender-color');

    if(sameChoice&&i===attackerChoice){
      b.classList.add('samePick');
      b.style.setProperty('--attacker-color',COLORS[pending.attacker]);
      b.style.setProperty('--defender-color',COLORS[defender]);
    }else{
      if(i===attackerChoice){
        b.classList.add('attackerFull');
        b.style.setProperty('--attacker-color',COLORS[pending.attacker]);
      }
      if(i===defenderChoice){
        b.classList.add('defenderFull');
        b.style.setProperty('--defender-color',COLORS[defender]);
      }
    }

    if(i===q[2])b.classList.add('correctReveal');
  });
}
function choiceResultText(q,attackerChoice,defenderChoice,defender){
  const aOk=attackerChoice===q[2],dOk=defenderChoice===q[2];
  return NAMES[pending.attacker]+': '+(aOk?'верно':'ошибка')+' · '+NAMES[defender]+': '+(dOk?'верно':'ошибка');
}
function battleMetaHtml(att,def,target){
  return '<span class="playerBadge" style="--badge:'+COLORS[att]+'"><i></i>'+NAMES[att]+'</span>'+
    '<span class="attackArrow">⚔ →</span>'+
    '<span class="playerBadge" style="--badge:'+COLORS[def]+'"><i></i>'+NAMES[def]+'</span>'+
    '<span class="targetBadge">'+targetLabel(target)+'</span>';
}
function openQuestion(att,def,target){
  clearQuestionUi();
  $('battleMeta').innerHTML=battleMetaHtml(att,def,target);
  $('questionOverlay').classList.add('show');
}
function closeQuestion(){
  stopQuestionTimer();
  $('questionOverlay').classList.remove('show');
  activeQuestion=null;
}

function askHumanMcq(def){
  if(!pending)return;
  const q=MCQ[Math.floor(Math.random()*MCQ.length)];
  openQuestion(pending.attacker,def,pending.target);
  $('qText').textContent=q[0];
  activeQuestion={type:'MCQ',q,def};
  q[1].forEach((a,i)=>{
    const b=document.createElement('button');
    b.className='answer';
    b.textContent=a;
    b.onclick=()=>humanMcqAnswered(i);
    $('answers').appendChild(b);
  });
  animateTimer(HUMAN_QUESTION_MS,()=>humanTimeout(def));
}
function humanTimeout(def){
  if(!pending)return;
  stopQuestionTimer(false);
  if(activeQuestion&&activeQuestion.type==='MCQ'){
    const q=activeQuestion.q;
    const botChoice=botChoiceIndex(q);
    const attackerChoice=pending.attacker==='R'?null:botChoice;
    const defenderChoice=def==='R'?null:botChoice;
    revealMcq(q,attackerChoice,defenderChoice,def);
    $('battleResult').textContent='Время вышло — человек проигрывает дуэль.';
    const winner=pending.attacker==='R'?'DEFENDER':'ATTACKER';
    setTimeout(()=>{closeQuestion();applyDuel(winner);},ANSWER_REVEAL_MS);
    return;
  }
  if(activeQuestion&&activeQuestion.type==='NUM'){
    const q=activeQuestion.q;
    const botGuess=q[1]*(1+(Math.random()-.5)*.28);
    const attackerGuess=pending.attacker==='R'?null:botGuess;
    const defenderGuess=def==='R'?null:botGuess;
    const winner=pending.attacker==='R'?'DEFENDER':'ATTACKER';
    showNumericReveal(def,attackerGuess,defenderGuess,q[1]).then(()=>{
      if(!pending)return;
      closeQuestion();applyDuel(winner);
    });
  }
}
function humanMcqAnswered(index){
  if(!pending||!activeQuestion||activeQuestion.type!=='MCQ')return;
  stopQuestionTimer(false);
  const {q,def}=activeQuestion;
  const botChoice=botChoiceIndex(q);
  const attackerChoice=pending.attacker==='R'?index:botChoice;
  const defenderChoice=def==='R'?index:botChoice;
  revealMcq(q,attackerChoice,defenderChoice,def);
  const attackerCorrect=attackerChoice===q[2];
  const defenderCorrect=defenderChoice===q[2];

  if(attackerCorrect&&defenderCorrect){
    $('battleResult').textContent=choiceResultText(q,attackerChoice,defenderChoice,def)+' · будет числовой тай-брейк.';
    setTimeout(()=>askHumanNumeric(def),ANSWER_REVEAL_MS);
    return;
  }
  const winner=attackerCorrect&&!defenderCorrect?'ATTACKER':'DEFENDER';
  $('battleResult').textContent=choiceResultText(q,attackerChoice,defenderChoice,def)+' · '+(winner==='ATTACKER'?'атакующий выигрывает':'защитник выигрывает')+'.';
  setTimeout(()=>{closeQuestion();applyDuel(winner);},ANSWER_REVEAL_MS);
}
function askHumanNumeric(def){
  if(!pending)return;
  const q=NUMS[Math.floor(Math.random()*NUMS.length)];
  clearQuestionUi();
  $('battleMeta').innerHTML=battleMetaHtml(pending.attacker,def,pending.target);
  $('qText').textContent=q[0];
  $('answers').style.display='none';
  $('numericBox').style.display='block';
  $('nInput').value='';
  $('nInput').focus();
  activeQuestion={type:'NUM',q,def};
  animateTimer(HUMAN_QUESTION_MS,()=>humanTimeout(def));
}
function formatNumber(v){
  if(v==null||!Number.isFinite(v))return '—';
  return String(Math.round(v*100)/100);
}
async function showNumericReveal(def,attackerGuess,defenderGuess,correct){
  $('numericBox').style.display='none';
  const result=$('battleResult');
  const rows=[
    {player:pending.attacker,value:attackerGuess,error:Number.isFinite(attackerGuess)?Math.abs(attackerGuess-correct):Infinity},
    {player:def,value:defenderGuess,error:Number.isFinite(defenderGuess)?Math.abs(defenderGuess-correct):Infinity}
  ];
  result.innerHTML='<div class="numericCorrect">Правильный ответ: <b>'+formatNumber(correct)+'</b></div>'+
    '<div class="numericRanking">'+rows.map(r=>'<div class="numericAnswerRow" data-player="'+r.player+'" data-error="'+r.error+'"><span class="numericRank"></span><i style="--numeric-color:'+COLORS[r.player]+'"></i><b>'+NAMES[r.player]+'</b><span>'+formatNumber(r.value)+'</span></div>').join('')+'</div>';
  await sleep(NUMERIC_REORDER_DELAY);
  if(!pending)return;
  const box=result.querySelector('.numericRanking');
  const nodes=[...box.children].sort((a,b)=>Number(a.dataset.error)-Number(b.dataset.error));
  nodes.forEach((node,index)=>{
    node.querySelector('.numericRank').textContent=(index+1)+'.';
    node.classList.add(index===0?'numericWinner':'numericLoser');
    box.appendChild(node);
  });
  await sleep(NUMERIC_RANKED_HOLD);
}
async function humanNumericSubmit(){
  if(!pending||!activeQuestion||activeQuestion.type!=='NUM')return;
  const v=parseFloat($('nInput').value);
  if(!Number.isFinite(v))return;
  stopQuestionTimer(false);
  const {q,def}=activeQuestion;
  const ans=q[1];
  const botGuess=ans*(1+(Math.random()-.5)*.28);
  const attackerGuess=pending.attacker==='R'?v:botGuess;
  const defenderGuess=def==='R'?v:botGuess;
  const winner=Math.abs(attackerGuess-ans)<=Math.abs(defenderGuess-ans)?'ATTACKER':'DEFENDER';
  await showNumericReveal(def,attackerGuess,defenderGuess,ans);
  if(!pending)return;
  closeQuestion();
  applyDuel(winner);
}

async function botVsBotMcq(def){
  if(!pending)return;
  const token=runId;
  const q=MCQ[Math.floor(Math.random()*MCQ.length)];
  openQuestion(pending.attacker,def,pending.target);
  $('qText').textContent=q[0];
  const buttons=q[1].map((a,i)=>{
    const b=document.createElement('button');
    b.className='answer';
    b.textContent=a;
    b.disabled=true;
    $('answers').appendChild(b);
    return b;
  });
  $('battleResult').textContent=NAMES[pending.attacker]+' и '+NAMES[def]+' думают…';
  const think=randomMs(BOT_THINK_MIN,BOT_THINK_MAX);
  animateTimer(HUMAN_QUESTION_MS,()=>{});
  await sleep(think);
  if(token!==runId||!pending)return;

  stopQuestionTimer(false);
  const ai=botChoiceIndex(q);
  const di=botChoiceIndex(q);
  revealMcq(q,ai,di,def);
  const aCorrect=ai===q[2],dCorrect=di===q[2];
  $('battleResult').textContent=choiceResultText(q,ai,di,def);

  await sleep(ANSWER_REVEAL_MS);
  if(token!==runId||!pending)return;
  if(aCorrect&&dCorrect)return botVsBotNumeric(def);
  const winner=aCorrect&&!dCorrect?'ATTACKER':'DEFENDER';
  closeQuestion();
  applyDuel(winner);
}
async function botVsBotNumeric(def){
  if(!pending)return;
  const token=runId;
  const q=NUMS[Math.floor(Math.random()*NUMS.length)];
  clearQuestionUi();
  $('battleMeta').innerHTML=battleMetaHtml(pending.attacker,def,pending.target);
  $('qText').textContent=q[0];
  $('answers').style.display='none';
  $('battleResult').textContent=NAMES[pending.attacker]+' и '+NAMES[def]+' считают…';
  const think=randomMs(BOT_THINK_MIN,BOT_THINK_MAX);
  animateTimer(HUMAN_QUESTION_MS,()=>{});
  await sleep(think);
  if(token!==runId||!pending)return;

  stopQuestionTimer(false);
  const ans=q[1];
  const ag=ans*(1+(Math.random()-.5)*.28);
  const dg=ans*(1+(Math.random()-.5)*.28);
  const winner=Math.abs(ag-ans)<=Math.abs(dg-ans)?'ATTACKER':'DEFENDER';
  await showNumericReveal(def,ag,dg,ans);
  if(token!==runId||!pending)return;
  closeQuestion();
  applyDuel(winner);
}

function applyDuel(winner){
  if(!pending)return;
  const target=pending.target;
  const attacker=pending.attacker;

  if(winner==='DEFENDER'){
    const defender=defenderFor(target);
    S.players[defender].defenseFame=(S.players[defender].defenseFame||0)+1;
    log(NAMES[defender]+' отбивают атаку на '+targetLabel(target)+' · +1 слава за защиту.');
    render();
    return finishBattle();
  }

  if(typeof target==='string'){
    S.bases[target]=Math.max(0,S.bases[target]-1);
    log(NAMES[attacker]+' разрушают слой базы '+target+'.');
    if(S.bases[target]===0){
      S.captured[target]=attacker;
      S.players[attacker].flags++;
      log(NAMES[attacker]+' захватывают флаг базы '+target+'.');
      render();
      return finishBattle();
    }
    render();
    setTimeout(startDuel,500);
    return;
  }

  const oldOwner=S.owners[target];
  S.owners[target]=attacker;
  S.players[attacker].coins+=10;
  log(NAMES[attacker]+' захватывают остров '+target+' у '+NAMES[oldOwner]+'.');
  render();
  finishBattle();
}
function finishBattle(){
  pending=null;
  interactionLocked=false;
  render();
  endTurn();
}
function endTurn(){
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
  }
  render();
  setTimeout(advanceWar,450);
}

function toggleSecret(){
  if(!S||S.phase!=='WAR'||S.finished||interactionLocked||S.order[S.idx]!=='R'||S.players.R.secret<=0)return;
  secretArmed=!secretArmed;
  render();
}

function showFinal(){
  closeQuestion();
  const arr=PLAYERS.map(p=>({p,score:fame(p)})).sort((a,b)=>b.score-a.score);
  $('finalBody').innerHTML='<table class="finalTable"><thead><tr><th>#</th><th>Игрок</th><th>Слава</th><th>Монеты</th><th>Флаги</th></tr></thead><tbody>'+
    arr.map((x,i)=>'<tr><td>'+(i+1)+'</td><td>'+NAMES[x.p]+'</td><td><b>'+x.score+'</b></td><td>'+S.players[x.p].coins+'</td><td>'+S.players[x.p].flags+'</td></tr>').join('')+
    '</tbody></table>';
  $('finalOverlay').classList.add('show');
}

function render(){
  if(!S)return;
  renderMap();
  renderHud();
  renderStandings();
  renderOrder();
}

function renderMap(){
  const map=$('map');
  map.innerHTML='';
  const legal=S.phase==='WAR'&&S.order[S.idx]==='R'&&!interactionLocked?new Set(legalTargets('R',secretArmed)):new Set();
  const claimable=S.phase==='CLAIM'&&currentClaimPlayer()==='R'&&!interactionLocked?new Set(claimFront('R')):new Set();

  for(let i=1;i<=36;i++){
    const b=document.createElement('button');
    b.className='tile l'+lv(i);
    if(!S.owners[i])b.classList.add('neutral');
    if(legal.has(i))b.classList.add('legal');
    if(claimable.has(i))b.classList.add('claimable');
    b.style.setProperty('--owner',S.owners[i]?COLORS[S.owners[i]]:'rgba(112,88,56,.35)');
    b.dataset.id=String(i);
    b.innerHTML='<small class="islandNo">#'+i+' · ★'+lv(i)+'</small>';
    map.appendChild(b);
  }

  for(const baseId of ['A','B','C','D']){
    const el=document.querySelector('[data-base="'+baseId+'"]');
    const owner=baseVisualOwner(baseId);
    el.style.setProperty('--baseColor',COLORS[owner]);
    el.classList.toggle('legal',legal.has(baseId));
    let meta=el.querySelector('.baseMeta');
    if(!meta){meta=document.createElement('span');meta.className='baseMeta';el.appendChild(meta);}
    if(S.captured[baseId])meta.textContent='База '+baseId+' · 🏴 '+NAMES[S.captured[baseId]];
    else meta.textContent='База '+baseId+(S.phase==='WAR'?' · 🛡'+S.bases[baseId]+' · 🏴9':'');
  }

  if(window.layoutPirateMap)window.layoutPirateMap(legal);
}
function renderHud(){
  document.body.dataset.phase=S.phase;
  $('coinsV').textContent=S.players.R.coins;
  $('fameV').textContent=fame('R');
  $('secretBtn').innerHTML='🗺<small>×'+S.players.R.secret+'</small>';
  $('secretBtn').classList.toggle('on',secretArmed);
  $('secretBtn').disabled=S.phase!=='WAR'||S.finished||interactionLocked||S.order[S.idx]!=='R'||S.players.R.secret<=0;

  if(S.phase==='CLAIM'){
    $('roundV').textContent='Освоение '+S.claimRound+'/6';
    const p=currentClaimPlayer();
    $('status').textContent=p==='R'?'Твой захват · выбери подсвеченный остров':'Освоение · '+NAMES[p]+' выбирают остров';
    $('actionBtn').textContent=p==='R'?'Выбери остров':'Ожидание…';
    $('actionBtn').disabled=true;
    return;
  }

  $('roundV').textContent=S.finished?'Финал':'Раунд '+S.round+'/8';
  if(S.finished){
    $('status').textContent='Партия окончена';
    $('actionBtn').textContent='Финал';
    $('actionBtn').disabled=true;
  }else if(pending){
    const def=defenderFor(pending.target);
    $('status').textContent=NAMES[pending.attacker]+' атакуют '+NAMES[def]+' · '+targetLabel(pending.target);
    $('actionBtn').textContent='Идёт бой';
    $('actionBtn').disabled=true;
  }else if(S.order[S.idx]==='R'){
    $('status').textContent=secretArmed?'Тайный путь · выбери любую вражескую цель':'Твой ход · выбери соседнюю вражескую территорию или базу';
    $('actionBtn').textContent='⚔ Выбери цель';
    $('actionBtn').disabled=true;
  }else{
    $('status').textContent='Ход · '+NAMES[S.order[S.idx]];
    $('actionBtn').textContent='Ход соперника';
    $('actionBtn').disabled=true;
  }
}
function renderStandings(){
  const root=$('standingsRows');
  if(!root)return;
  root.innerHTML='';
  const rows=PLAYERS
    .map((p,stable)=>({p,score:fame(p),stable}))
    .sort((a,b)=>b.score-a.score||a.stable-b.stable);
  rows.forEach((row,index)=>{
    const el=document.createElement('div');
    el.className='standingRow'+(row.p==='R'?' human':'');
    el.innerHTML='<span class="standingPlace">'+(index+1)+'</span>'+
      '<span class="standingColor" style="--standing-color:'+COLORS[row.p]+'"></span>'+
      '<span class="standingScore">'+row.score+'</span>';
    root.appendChild(el);
  });
}

function renderOrder(){
  const root=$('turnTimeline');
  root.innerHTML='';
  $('turnCaption').textContent='';
  const claim=S.phase==='CLAIM';
  const plans=claim?S.claimOrders:S.orders;
  const currentRound=claim?S.claimRound-1:S.round-1;
  const currentIndex=claim?S.claimIndex:S.idx;
  const currentPlayer=claim?currentClaimPlayer():(S.order[S.idx]||null);

  plans.forEach((plan,roundIndex)=>{
    const order=claim?plan.rank:plan;
    const group=document.createElement('div');
    group.className='orderGroup';
    if(roundIndex<currentRound)group.classList.add('doneRound');
    if(roundIndex===currentRound)group.classList.add('currentRound');
    if(roundIndex>currentRound)group.classList.add('futureRound');

    order.forEach((p,i)=>{
      const mark=document.createElement('span');
      mark.className='orderMark';
      mark.style.setProperty('--order-color',COLORS[p]);
      mark.title='Раунд '+(roundIndex+1)+' · '+NAMES[p];

      if(roundIndex===currentRound){
        if(claim){
          if(p===currentPlayer&&!S.finished)mark.classList.add('current');
          const completedPlayers=new Set(S.claimQueue.slice(0,currentIndex));
          if(completedPlayers.has(p)&&p!==currentPlayer)mark.classList.add('done');
        }else{
          if(i<currentIndex)mark.classList.add('done');
          if(i===currentIndex&&!S.finished)mark.classList.add('current');
        }
      }
      group.appendChild(mark);
    });
    root.appendChild(group);
  });
}

document.addEventListener('click',e=>{
  const tile=e.target.closest('#map [data-id]');
  if(tile){
    const id=Number(tile.dataset.id);
    if(S&&S.phase==='CLAIM')humanClaim(id);
    else if(S&&S.phase==='WAR')humanAttack(id);
    return;
  }
  const base=e.target.closest('[data-base]');
  if(base&&S&&S.phase==='WAR')humanAttack(base.dataset.base);
});
$('secretBtn').onclick=toggleSecret;
$('nSend').onclick=humanNumericSubmit;
$('nInput').addEventListener('keydown',e=>{if(e.key==='Enter')humanNumericSubmit();});
$('newBtn').onclick=newGame;

window.PiratesNoFlagship={newGame,render,adj,COLORS,NAMES,BASE,OWNER_BASE,lv};
