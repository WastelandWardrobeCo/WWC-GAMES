const $=id=>document.getElementById(id);

const CARD_LIBRARY=[
{id:'spear-thrust',name:'Spear Thrust',cost:1,type:'Attack',rarity:'Common',icon:'⚔',rulesText:'Deal 7 damage.',keywords:['Precision'],effects:[{type:'damage',amount:7,target:'enemy'}]},
{id:'lady-strikes',name:'Lady Strikes',cost:2,type:'Companion',rarity:'Uncommon',icon:'🐺',rulesText:'Deal 11 damage. Apply 1 Flanked.',keywords:['Flanked'],effects:[{type:'damage',amount:11,target:'enemy'},{type:'status',status:'Flanked',amount:1,target:'enemy'}]},
{id:'black-leathers',name:'Black Leathers',cost:1,type:'Guard',rarity:'Common',icon:'◆',rulesText:'Gain 8 Armor.',keywords:['Armor'],effects:[{type:'armor',amount:8,target:'player'}]},
{id:'hunter-focus',name:'Hunter’s Focus',cost:0,type:'Precision',rarity:'Uncommon',icon:'◉',rulesText:'Draw 2 cards. Gain 1 Energy. Exhaust.',keywords:['Draw','Exhaust'],exhaust:true,effects:[{type:'draw',amount:2,target:'player'},{type:'energy',amount:1,target:'player'}]},
{id:'intimacy-blade',name:'Intimacy Blade',cost:2,type:'Attack',rarity:'Rare',icon:'🗡',rulesText:'Deal 9 damage. Deal 6 more if the enemy is Bleeding.',keywords:['Bleeding'],effects:[{type:'damage',amount:9,target:'enemy'},{type:'conditionalDamage',amount:6,status:'Bleeding',target:'enemy'}]},
{id:'barbed-arrow',name:'Barbed Arrow',cost:1,type:'Attack',rarity:'Common',icon:'➶',rulesText:'Deal 4 damage. Apply 3 Bleeding.',keywords:['Bleeding'],effects:[{type:'damage',amount:4,target:'enemy'},{type:'status',status:'Bleeding',amount:3,target:'enemy'}]},
{id:'wrong-fire',name:'The Wrong Fire',cost:1,type:'Trap',rarity:'Rare',icon:'🔥',rulesText:'Apply 2 Terrified and 1 Flanked.',keywords:['Terrified','Flanked'],effects:[{type:'status',status:'Terrified',amount:2,target:'enemy'},{type:'status',status:'Flanked',amount:1,target:'enemy'}]},
{id:'done-here',name:'We’re Done Here',cost:3,type:'Attack',rarity:'Legendary',icon:'✦',rulesText:'Deal 18 damage. Execute below 25% Health.',keywords:['Execute'],effects:[{type:'damage',amount:18,target:'enemy'},{type:'execute',threshold:.25,target:'enemy'}]},
{id:'steady-breath',name:'Steady Breath',cost:1,type:'Survival',rarity:'Common',icon:'❖',rulesText:'Heal 6. Gain 3 Armor.',keywords:['Heal'],effects:[{type:'heal',amount:6,target:'player'},{type:'armor',amount:3,target:'player'}]}
];

const ENEMY_CARDS=[
{name:'Rusty Cleaver',cost:1,rulesText:'Deal 8 damage.',effects:[{type:'damage',amount:8,target:'player'}]},
{name:'Hook and Drag',cost:1,rulesText:'Deal 5 damage. Apply 1 Flanked.',effects:[{type:'damage',amount:5,target:'player'},{type:'status',status:'Flanked',amount:1,target:'player'}]},
{name:'Brace',cost:1,rulesText:'Gain 7 Armor.',effects:[{type:'armor',amount:7,target:'enemy'}]},
{name:'Cruel Grin',cost:1,rulesText:'Apply 2 Terrified.',effects:[{type:'status',status:'Terrified',amount:2,target:'player'}]},
{name:'Heavy Swing',cost:2,rulesText:'Deal 14 damage.',effects:[{type:'damage',amount:14,target:'player'}]}
];

const freshState=()=>({
 round:1,turn:'player',energy:3,maxEnergy:3,
 player:{hp:70,maxHp:70,armor:0,statuses:{}},enemy:{name:'White Tree Raider',hp:52,maxHp:52,armor:0,statuses:{}},
 draw:shuffle([...CARD_LIBRARY,...CARD_LIBRARY.slice(0,6)]),hand:[],discard:[],exhaust:[],enemyDeck:shuffle([...ENEMY_CARDS,...ENEMY_CARDS]),enemyDiscard:[],enemyIntent:null,log:['The raider reaches for steel. Lady bares her teeth.']
});
let state=freshState();

function shuffle(items){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function status(entity,name){return entity.statuses[name]||0}
function addStatus(entity,name,amount){entity.statuses[name]=(entity.statuses[name]||0)+amount}
function log(text){state.log.unshift(text);state.log=state.log.slice(0,4)}
function draw(count){for(let i=0;i<count;i++){if(!state.draw.length){if(!state.discard.length)break;state.draw=shuffle(state.discard);state.discard=[];log('The discard pile is reshuffled.')}state.hand.push(state.draw.pop())}}
function mitigate(target,amount){let value=amount;if(status(target,'Terrified'))value=Math.max(0,value-2);if(status(target,'Flanked'))value+=3;const blocked=Math.min(target.armor,value);target.armor-=blocked;target.hp=Math.max(0,target.hp-(value-blocked));return {dealt:value-blocked,blocked}}
function resolveEffect(effect,sourceLabel){const target=effect.target==='player'?state.player:state.enemy;switch(effect.type){
 case'damage':{const r=mitigate(target,effect.amount);log(`${sourceLabel} deals ${r.dealt} damage${r.blocked?` (${r.blocked} blocked)`:''}.`);break}
 case'conditionalDamage':if(status(target,effect.status)){const r=mitigate(target,effect.amount);log(`${effect.status} triggers ${r.dealt} bonus damage.`)}break;
 case'armor':target.armor+=effect.amount;log(`${sourceLabel} grants ${effect.amount} Armor.`);break;
 case'heal':{const before=target.hp;target.hp=Math.min(target.maxHp,target.hp+effect.amount);log(`${sourceLabel} restores ${target.hp-before} Health.`);break}
 case'status':addStatus(target,effect.status,effect.amount);log(`${target===state.player?'Delilah':state.enemy.name} gains ${effect.amount} ${effect.status}.`);break;
 case'draw':draw(effect.amount);log(`Draw ${effect.amount} cards.`);break;
 case'energy':state.energy=Math.min(6,state.energy+effect.amount);log(`Gain ${effect.amount} Energy.`);break;
 case'execute':if(target.hp>0&&target.hp/target.maxHp<=effect.threshold){target.hp=0;log('Execute. The hunt ends at once.')}break;
 }}
function playCard(index){if(state.turn!=='player'||state.player.hp<=0||state.enemy.hp<=0)return;const card=state.hand[index];if(!card||card.cost>state.energy)return;state.energy-=card.cost;state.hand.splice(index,1);log(`Delilah plays ${card.name}.`);card.effects.forEach(e=>resolveEffect(e,card.name));(card.exhaust?state.exhaust:state.discard).push(card);checkEnd();render()}
function chooseEnemyIntent(){if(!state.enemyDeck.length){state.enemyDeck=shuffle(state.enemyDiscard);state.enemyDiscard=[]}const affordable=state.enemyDeck.filter(c=>c.cost<=2);state.enemyIntent=affordable[Math.floor(Math.random()*affordable.length)]||state.enemyDeck[0]}
function enemyTurn(){if(state.enemy.hp<=0)return;state.turn='enemy';const card=state.enemyIntent;log(`${state.enemy.name} plays ${card.name}.`);card.effects.forEach(e=>resolveEffect(e,card.name));const idx=state.enemyDeck.indexOf(card);if(idx>=0)state.enemyDeck.splice(idx,1);state.enemyDiscard.push(card);tickStatuses(state.player,'Delilah');tickStatuses(state.enemy,state.enemy.name);checkEnd();if(state.player.hp>0&&state.enemy.hp>0){state.round++;state.turn='player';state.energy=state.maxEnergy;state.player.armor=0;state.enemy.armor=0;draw(5-state.hand.length);chooseEnemyIntent()}render()}
function tickStatuses(entity,label){if(status(entity,'Bleeding')){const amount=status(entity,'Bleeding');entity.hp=Math.max(0,entity.hp-amount);log(`${label} loses ${amount} Health to Bleeding.`)}Object.keys(entity.statuses).forEach(k=>{entity.statuses[k]=Math.max(0,entity.statuses[k]-1);if(!entity.statuses[k])delete entity.statuses[k]})}
function checkEnd(){if(state.enemy.hp<=0)showResult(true);else if(state.player.hp<=0)showResult(false)}
function showResult(win){$('resultTitle').textContent=win?'Victory':'The Hunt Ends';$('resultCopy').textContent=win?'The White Tree raider falls. The engine has resolved a complete battle using reusable card effects.':'Delilah falls, but the battle can begin again with a newly shuffled deck.';setTimeout(()=>$('resultDialog').showModal(),250)}
function cardHtml(card,index,interactive=true){const disabled=interactive&&card.cost>state.energy;return `<button class="card ${disabled?'disabled':''}" ${interactive?`data-index="${index}"`:''}><div class="card-head"><h3>${escapeHtml(card.name)}</h3><span class="cost">${card.cost}</span></div><div class="card-art">${card.icon||'◆'}</div><div class="card-type">${(card.type||'ENEMY').toUpperCase()} · ${(card.rarity||'STANDARD').toUpperCase()}</div><div class="card-rules">${escapeHtml(card.rulesText)}</div><div class="card-keywords">${(card.keywords||[]).join(' · ')}</div></button>`}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function statusHtml(entity){return Object.entries(entity.statuses).map(([k,v])=>`<span class="status">${escapeHtml(k)} ${v}</span>`).join('')}
function render(){
 $('round').textContent=state.round;$('energy').textContent=state.energy;$('enemyName').textContent=state.enemy.name;
 $('playerHp').textContent=`${state.player.hp} / ${state.player.maxHp}`;$('enemyHp').textContent=`${state.enemy.hp} / ${state.enemy.maxHp}`;
 $('playerArmor').textContent=`${state.player.armor} Armor`;$('enemyArmor').textContent=`${state.enemy.armor} Armor`;
 $('playerHpBar').style.width=`${100*state.player.hp/state.player.maxHp}%`;$('enemyHpBar').style.width=`${100*state.enemy.hp/state.enemy.maxHp}%`;
 $('playerStatuses').innerHTML=statusHtml(state.player);$('enemyStatuses').innerHTML=statusHtml(state.enemy);
 $('enemyIntent').textContent=state.enemyIntent?`${state.enemyIntent.name}: ${state.enemyIntent.rulesText}`:'Planning…';
 $('drawCount').textContent=state.draw.length;$('discardCount').textContent=state.discard.length;$('exhaustCount').textContent=state.exhaust.length;
 $('battleLog').innerHTML=state.log.map(x=>`<div>${escapeHtml(x)}</div>`).join('');
 $('hand').innerHTML=state.hand.map((c,i)=>cardHtml(c,i,true)).join('');
 document.querySelectorAll('.card[data-index]').forEach(el=>el.addEventListener('click',()=>playCard(Number(el.dataset.index))));
 $('endTurnBtn').disabled=state.turn!=='player';
}
function openPile(title,cards){$('pileTitle').textContent=title;$('pileCards').innerHTML=cards.length?cards.map(c=>`<div class="pile-card"><b>${escapeHtml(c.name)}</b><span>${escapeHtml(c.rulesText)}</span></div>`).join(''):'<p>No cards here.</p>';$('pileDialog').showModal()}
function start(){state=freshState();draw(5);chooseEnemyIntent();render()}
$('endTurnBtn').addEventListener('click',enemyTurn);$('newRunBtn').addEventListener('click',start);$('restartBtn').addEventListener('click',()=>{$('resultDialog').close();start()});
$('drawPileBtn').addEventListener('click',()=>openPile('Draw Pile',state.draw));$('discardPileBtn').addEventListener('click',()=>openPile('Discard Pile',state.discard));$('exhaustPileBtn').addEventListener('click',()=>openPile('Exhaust Pile',state.exhaust));$('closePileBtn').addEventListener('click',()=>$('pileDialog').close());
start();