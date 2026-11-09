import { expeditions, launchExpedition, claimExpedition } from './game.js';

// Read live game state so timers continue across navigation and app suspension.
export function mountExpeditions({ getState, commit, format, time }) {
  const host=document.createElement('section');
  host.className='expeditions panel';
  host.innerHTML=`<div class="section-title"><div><span class="eyebrow">SEND A SCOUT. COME BACK TO SOMETHING GOOD.</span><h2>Away among the stars</h2></div><span class="expedition-badge">ONE SCOUT · THREE ROUTES</span></div><div id="routes"></div><p class="mission-note">Expeditions keep their own timer, even while the app is closed. Your collectors keep working too.</p>`;
  document.querySelector('#journey-view').insertBefore(host,document.querySelector('#journey'));
  document.querySelector('.right-column').insertAdjacentHTML('beforeend',`<button class="scout-shortcut" data-tab="journey"><span>✦</span><div><strong id="scout-label">Your next adventure awaits</strong><small id="scout-time">Send a scout on a timed expedition</small></div><span>→</span></button>`);
  const routes=host.querySelector('#routes');
  routes.innerHTML=expeditions.map((m,i)=>`<article class="route" data-route="${i}"><span class="upgrade-icon">${m.icon}</span><div class="route-copy"><h3>${m.name}</h3><p>${time(m.duration)} flight · <strong>+${format(m.reward)} ✧</strong> reward</p><span class="route-status" id="route-status-${i}"></span><div class="track"><i id="route-progress-${i}"></i></div></div><button data-launch="${i}"></button></article>`).join('');
  host.addEventListener('click',e=>{
    const b=e.target.closest('[data-launch]');if(!b)return;
    const state=getState(),id=+b.dataset.launch;
    const next=state.expedition?.id===id?claimExpedition(state):launchExpedition(state,id);
    if(next!==state)commit(next,state.expedition?'Expedition reward collected ✦':`${expeditions[id].name} launched. Safe travels!`);
  });
  return function render(){
    const state=getState(),active=state.expedition;
    for(const [i,m] of expeditions.entries()){
      const current=active?.id===i;
      const seconds=current?Math.max(0,(active.ends-Date.now())/1000):m.duration;
      const ready=current&&seconds===0;
      const button=routes.querySelector(`[data-launch="${i}"]`);
      button.disabled=active?(!current||!ready):state.dust<m.cost;
      button.textContent=current?(ready?'Claim reward':'In flight'):active?'Scout away':`Launch · ${format(m.cost)} ✧`;
      routes.querySelector(`#route-status-${i}`).textContent=current?(ready?'Scout returned. Your reward is ready.':`Returns in ${time(seconds)}`):active?'One expedition at a time':'Ready when you are';
      routes.querySelector(`#route-progress-${i}`).style.width=current?`${Math.min(100,Math.max(0,1-seconds/m.duration)*100)}%`:'0%';
      routes.querySelector(`[data-route="${i}"]`).classList.toggle('in-flight',current);
    }
    document.querySelector('#scout-label').textContent=active?expeditions[active.id].name:'Your next adventure awaits';
    document.querySelector('#scout-time').textContent=active?(Date.now()>=active.ends?'Reward ready · Claim in Journey':`Scout returns in ${time((active.ends-Date.now())/1000)}`):'Send a scout on a timed expedition';
  };
}
