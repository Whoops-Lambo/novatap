import './style.css';
import './mobile.css';
import {mountExpeditions} from './expeditions.js';
import {energyCapacity,energyCost,buyEnergy,REGEN,upgrades,fresh,rate,cost,advance,tap,buy,load,nextMilestone,sectorBonus} from './game.js';
const preciseFormat=new Intl.NumberFormat('en',{maximumFractionDigits:1});
const wholeFormat=new Intl.NumberFormat('en',{maximumFractionDigits:0});
const compactFormat=new Intl.NumberFormat('en',{maximumFractionDigits:0,notation:'compact'});
const fmt=n=>(n>=100000?compactFormat:n<100?preciseFormat:wholeFormat).format(n);
let saveTimer,renderFrame=0,audioContext;
const tabScroll={collect:0,upgrades:0,journey:0};
function render(){
  if(renderFrame)return;
  renderFrame=requestAnimationFrame(()=>{renderFrame=0;renderNow();});
}
function saveSoon(){if(!saveTimer)saveTimer=setTimeout(save,250);}
const time=n=>{n=Math.max(0,Math.ceil(n));return n>=3600?`${Math.floor(n/3600)}h ${Math.floor(n%3600/60)}m`:n>=60?`${Math.floor(n/60)}m ${n%60}s`:`${n}s`;};
let s;try{s=load(localStorage.getItem('novatap'));}catch{s=fresh();}
let offline=Math.floor(Math.min(28800,Math.max(0,(Date.now()-s.last)/1000))*rate(s));s=advance(s);let tab='collect',toastTimer;let sound=false;
const app=document.querySelector('#app');
app.innerHTML=`<aside class="sidebar"><a class="brand" href="#">✳ <span>nova<span class="light">tap</span><small>A LITTLE TAP. A BIG UNIVERSE.</small></span></a><div class="nav-caption">YOUR UNIVERSE</div><nav><button data-tab="collect" class="active">◉ <span>Collect</span><b>01</b></button><button data-tab="upgrades">⌁ <span>Upgrades</span><b>02</b></button><button data-tab="journey">♧ <span>Journey</span><b>03</b></button></nav><div class="sidebar-bottom"><div class="online-dot"></div> All progress saved on this device<p>Your universe keeps growing.<br>Even when you're away.</p><span>v1.2 · MADE FOR THE LONG RUN</span></div></aside><main><header><div><span class="mobile-brand">✳ NovaTap</span><span class="eyebrow">YOUR LITTLE COSMIC EMPIRE</span><h1>A little closer to the stars<span>.</span></h1><p>Tap. Grow. Go live your life. We'll keep collecting.</p></div><button class="sound" aria-label="Toggle sound" aria-pressed="false">♫</button></header><section class="stats"><div><span class="stat-label">✧ &nbsp; STARDUST</span><strong id="dust"></strong><small>Your next big thing starts here</small></div><div><span class="stat-label">→ &nbsp; PASSIVE INCOME</span><strong><span id="rate"></span><em> / sec</em></strong><small>Working hard while you hardly work</small></div><div><span class="stat-label">◷ &nbsp; OFFLINE STORAGE</span><strong>8 <em>hours</em></strong><small>Come back to a pocket full of stars</small></div></section><div id="collect-view" class="view"><div class="game-grid"><section class="collector panel"><div class="panel-heading"><span class="eyebrow">THE COSMIC GROVE</span><span class="pill"><i></i> SECTOR <span id="sector">01</span></span></div><div class="orbit-scene"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="star s1">✦</span><span class="star s2">✧</span><span class="star s3">✦</span><span class="planet"></span><button id="orb" aria-label="Collect stardust"><span class="orb-core">✳</span></button><div id="particles"></div></div><div class="tap-caption"><h2>A universe at your fingertips.</h2><p>Tap the nova to collect stardust</p><span id="tap-gain" class="gain"></span></div><div class="energy"><div><span>ϟ &nbsp; Energy</span><strong id="energy"></strong></div><div class="track"><i id="energy-bar"></i></div><p id="regen"></p><button class="text-button energy-link" data-tab="upgrades" aria-label="Upgrade energy capacity"><span class="energy-link-copy">Upgrade energy capacity →</span><span class="energy-link-icon" aria-hidden="true">＋</span></button></div></section><section class="right-column"><div class="panel next-panel"><div class="section-label"><span class="eyebrow">A LITTLE SOMETHING TO LOOK FORWARD TO</span><span>→</span></div><div class="milestone-icon">⌂</div><h2 id="milestone-title"></h2><p id="milestone-desc"></p><div class="progress-info"><span id="milestone-progress"></span><span id="milestone-target"></span></div><div class="track"><i id="milestone-bar"></i></div><div class="eta" id="eta"></div><button class="milestone-action" id="milestone-buy"></button></div><div class="offline-card"><span class="offline-icon">☾</span><div><h3>Good things take downtime.</h3><p>Your collectors work while you're away.<br>Offline earnings are collected automatically.</p></div><span>✧</span></div></section></div><section class="upgrade-section"><div class="section-title"><div><span class="eyebrow">LET YOUR UNIVERSE DO THE WORK</span><h2>A little help from the cosmos</h2></div><button class="text-button" data-tab="upgrades">All upgrades →</button></div><div class="upgrade-grid" id="cards"></div></section></div><div id="upgrades-view" class="view hidden"><div class="section-title"><div><span class="eyebrow">INVEST IN YOUR UNIVERSE</span><h2>Small upgrades. Stellar possibilities.</h2></div></div><div class="upgrade-grid" id="all-cards"></div><div class="panel power"><div><h2>Supercharged touch</h2><p>One extra stardust with every tap.</p></div><button id="power"></button></div><div class="panel power" id="energy-upgrade"><div><span class="eyebrow" id="energy-level"></span><h2>Bigger energy reserve</h2><p id="energy-description"></p><p>Adds 100 energy now. A full recharge still takes 8 hours.</p></div><button id="buy-energy"></button></div></div><div id="journey-view" class="view hidden"><span class="eyebrow">EVERY STAR STARTS SOMEWHERE</span><h2>Your cosmic journey</h2><div id="journey"></div></div><footer><span><i class="online-dot"></i> Your progress is saved automatically</span><span>Slow down. Look up. Keep growing. ✦</span></footer></main><div id="toast" role="status"></div><div id="welcome" class="modal-wrap hidden"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="welcome-title"><span class="eyebrow">THE UNIVERSE MISSED YOU</span><h2 id="welcome-title">Welcome back, explorer.</h2><p>Your collectors have been busy.</p><strong id="offline-amount"></strong><button id="dismiss">Keep growing →</button></div></div>`;
const cards=()=>upgrades.map((u,i)=>`<article class="upgrade-card"><div class="card-top"><span class="upgrade-icon">${u.icon}</span><span class="level">LEVEL <b data-level="${i}"></b></span></div><h3>${u.name}</h3><p>${u.desc}</p><div class="card-bottom"><span>+${u.rate} <small>✧ / sec</small></span><button data-buy="${i}"></button></div></article>`).join('');
document.querySelector('#cards').innerHTML=cards();document.querySelector('#all-cards').innerHTML=cards();
function notify(message){document.querySelector('#toast').textContent=message;document.querySelector('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>document.querySelector('#toast').classList.remove('show'),2500);}
function save(){clearTimeout(saveTimer);saveTimer=null;try{localStorage.setItem('novatap',JSON.stringify(s));}catch{notify('Storage is unavailable. Keep this app open to retain progress.');}}
const renderExpeditions=mountExpeditions({getState:()=>s,commit:(next,message)=>{s=next;save();render();notify(message);},format:fmt,time});
function renderMilestone(){
  const m=nextMilestone(s),u=upgrades[m.index];
  document.querySelector('#milestone-title').textContent=s.levels[m.index]===0?`Your first ${u.name.toLowerCase()}`:`${u.name} · level ${s.levels[m.index]+1}`;
  document.querySelector('#milestone-desc').textContent=`${u.desc} +${fmt(u.rate*sectorBonus(s))} stardust per second.`;
  document.querySelector('#milestone-progress').textContent=`${fmt(Math.min(s.dust,m.price))} stardust`;
  document.querySelector('#milestone-target').textContent=`${fmt(m.price)} ✧`;
  document.querySelector('#milestone-bar').style.width=`${Math.min(100,s.dust/m.price*100)}%`;
  document.querySelector('#eta').textContent=m.seconds===0?'Ready to build. Your universe is waiting.':m.seconds===null?'Tap to fund your first collector.':m.seconds>28800?`At least ${Math.ceil(m.seconds/28800)} offline visits at your current rate · 8h storage cap`:`Ready in ${time(m.seconds)} at your current rate`;
  const b=document.querySelector('#milestone-buy');b.textContent=m.seconds===0?'Build upgrade →':`Save up ${fmt(m.price-s.dust)} more ✧`;b.disabled=m.seconds!==0;
}
document.querySelector('#milestone-buy').onclick=()=>{s=advance(s);const m=nextMilestone(s);const next=buy(s,m.index);if(next!==s){s=next;save();render();notify(`${upgrades[m.index].name} built ✦`);}};
function renderNow(){
  document.querySelector('#dust').textContent=fmt(s.dust);
  document.querySelector('#rate').textContent=fmt(rate(s));
  if(tab==='collect'){
    const capacity=energyCapacity(s);
    document.querySelector('#energy').textContent=`${Math.floor(s.energy)} / ${capacity}`;
    document.querySelector('#energy-bar').style.width=`${s.energy/capacity*100}%`;
    document.querySelector('#regen').textContent=s.energy>=capacity?'Fully charged. The stars are yours.':`Full energy in ${time((capacity-s.energy)*REGEN/capacity)} · +1 every ${Math.ceil(REGEN/capacity)}s`;
    document.querySelector('#tap-gain').textContent=`+${1+s.tapLevel} stardust per tap`;
    document.querySelector('#sector').textContent=String(s.sector).padStart(2,'0');
    renderMilestone();
  }
  const view=document.querySelector(`#${tab}-view`);
  view.querySelectorAll('[data-level]').forEach(e=>e.textContent=s.levels[+e.dataset.level]);
  view.querySelectorAll('[data-buy]').forEach(e=>{
    const c=cost(s,+e.dataset.buy);
    e.setAttribute('aria-label',`Upgrade ${upgrades[+e.dataset.buy].name} for ${fmt(c)} stardust`);
    e.textContent=`✧ ${fmt(c)} +`;
    e.disabled=s.dust<c;
  });
  if(tab==='upgrades'){
    const pc=100*2**s.tapLevel;
    document.querySelector('#power').textContent=`Upgrade · ${fmt(pc)} ✧`;
    document.querySelector('#power').disabled=s.dust<pc;
    renderEnergyUpgrade();
  }
  if(tab!=='upgrades')renderExpeditions();
  if(tab==='journey')renderJourney();
}
const goals=[100,1000,10000];
let journeyMounted=false;
function renderJourney(){
  if(!journeyMounted){
    document.querySelector('#journey').innerHTML=goals.map((n,i)=>`<div class="panel journey-row"><span class="upgrade-icon">${['✧','☽','✦'][i]}</span><div><h3>${['First light','Moonbound','A new frontier'][i]}</h3><p>Collect ${fmt(n)} lifetime stardust · Reward ${fmt(n/5)} stardust</p><div class="track"><i data-goal-bar="${i}"></i></div></div><button data-claim="${i}"></button></div>`).join('')+`<div class="panel power"><div><h2 id="sector-title"></h2><p id="sector-description"></p></div><button id="explore">Explore →</button></div>`;
    journeyMounted=true;
  }
  goals.forEach((n,i)=>{
    document.querySelector(`[data-goal-bar="${i}"]`).style.width=`${Math.min(100,s.total/n*100)}%`;
    const b=document.querySelector(`[data-claim="${i}"]`);
    b.textContent=s.claimed.includes(i)?'Claimed':s.total>=n?'Claim reward':`${fmt(s.total)} / ${fmt(n)}`;
    b.disabled=s.total<n||s.claimed.includes(i);
  });
  document.querySelector('#sector-title').textContent=`Discover sector ${s.sector+1}`;
  document.querySelector('#sector-description').textContent=`Spend ${fmt(s.sector*5000)} stardust. Every sector adds +15% to base passive income. Current bonus: +${Math.round((sectorBonus(s)-1)*100)}%.`;
  document.querySelector('#explore').disabled=s.dust<s.sector*5000;
}
function navigate(next,energyShortcut=false){
  tabScroll[tab]=Math.max(0,window.scrollY);
  tab=next;
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('hidden',v.id!==`${tab}-view`));
  document.querySelectorAll('nav button').forEach(b=>{
    const active=b.dataset.tab===tab;
    b.classList.toggle('active',active);
    if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
  // Render before restoring the scroll position so newly opened views have their full height.
  renderNow();
  window.scrollTo({top:tabScroll[tab],behavior:'auto'});
  if(energyShortcut)document.querySelector('#energy-upgrade').scrollIntoView({block:'center',behavior:'auto'});
}
app.addEventListener('click',e=>{s=advance(s);const nav=e.target.closest('[data-tab]');if(nav)navigate(nav.dataset.tab,nav.classList.contains('energy-link'));const b=e.target.closest('[data-buy]');if(b){const next=buy(s,+b.dataset.buy);if(next!==s){s=next;notify(`${upgrades[+b.dataset.buy].name} upgraded ✧`);save();render();}}const claim=e.target.closest('[data-claim]');if(claim){const i=+claim.dataset.claim,n=[100,1000,10000][i];if(s.total>=n&&!s.claimed.includes(i)){s.dust+=n/5;s.claimed.push(i);save();render();notify('Milestone reward collected ✦');}}if(e.target.closest('#explore')&&s.dust>=s.sector*5000){s.dust-=s.sector*5000;s.sector++;save();render();notify('A new sector awaits ✦');}});
document.querySelector('#orb').addEventListener('click',()=>{s=advance(s);if(s.energy<1){notify('Your nova is recharging. Collectors keep working.');return;}s=tap(s);const particle=document.createElement('span');particle.className='particle';particle.textContent=`+${1+s.tapLevel} ✧`;particle.style.left=`${40+Math.random()*20}%`;const particles=document.querySelector('#particles');if(particles.childElementCount>=8)particles.firstElementChild.remove();particles.append(particle);setTimeout(()=>particle.remove(),1000);if(sound){try{const ctx=audioContext??=new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')void ctx.resume();const osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);osc.frequency.value=520+Math.random()*200;gain.gain.setValueAtTime(.04,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.12);osc.start();osc.stop(ctx.currentTime+.12);osc.onended=()=>{osc.disconnect();gain.disconnect();};}catch{}}saveSoon();render();});
document.querySelector('#power').onclick=()=>{s=advance(s);const c=100*2**s.tapLevel;if(s.dust>=c){s.dust-=c;s.tapLevel++;save();render();notify('Your touch just got more powerful.');}};document.querySelector('.sound').onclick=e=>{sound=!sound;if(!sound&&audioContext)void audioContext.suspend();e.currentTarget.classList.toggle('on',sound);e.currentTarget.setAttribute('aria-pressed',String(sound));notify(`Sound ${sound?'on':'off'}`);};document.querySelector('#dismiss').onclick=closeWelcome;
function resume(){const earned=Math.floor(Math.min(28800,Math.max(0,(Date.now()-s.last)/1000))*rate(s));s=advance(s);if(earned>=1)showOffline(earned);save();render();}
function showOffline(n){document.querySelector('#offline-amount').textContent=`+${fmt(n)} ✧`;document.querySelector('#welcome').classList.remove('hidden');document.querySelector('main').inert=true;document.querySelector('.sidebar').inert=true;document.body.classList.add('dialog-open');document.querySelector('#dismiss').focus();}
function closeWelcome(){document.querySelector('#welcome').classList.add('hidden');document.querySelector('main').inert=false;document.querySelector('.sidebar').inert=false;document.body.classList.remove('dialog-open');document.querySelector('nav .active').focus({preventScroll:true});}
document.querySelector('#welcome').addEventListener('keydown',e=>{if(e.key==='Escape')closeWelcome();if(e.key==='Tab'){e.preventDefault();document.querySelector('#dismiss').focus();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){s=advance(s);save();if(audioContext)void audioContext.suspend();}else resume();});window.addEventListener('pagehide',save);setInterval(()=>{if(!document.hidden){s=advance(s);render();save();}},1000);document.querySelector('nav .active').setAttribute('aria-current','page');renderNow();if(offline>=1)showOffline(offline);

function renderEnergyUpgrade(){
  const capacity=energyCapacity(s),price=energyCost(s);
  document.querySelector('#energy-level').textContent=`ENERGY RESERVE · LEVEL ${s.energyLevel}`;
  document.querySelector('#energy-description').textContent=`Increase maximum energy from ${capacity} to ${capacity+100}.`;
  const button=document.querySelector('#buy-energy');
  button.textContent=`+100 capacity · ${fmt(price)} ✧`;
  button.setAttribute('aria-label',`Upgrade energy capacity to ${capacity+100} for ${fmt(price)} stardust`);
  button.disabled=s.dust<price;
}
document.querySelector('#buy-energy').onclick=()=>{
  s=advance(s);
  const upgraded=buyEnergy(s);
  if(upgraded===s)return;
  s=upgraded;save();render();notify(`Energy capacity increased to ${energyCapacity(s)} ϟ`);
};
