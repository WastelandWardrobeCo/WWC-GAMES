(function(global){
'use strict';

const VERSION=1;
const KEYS={
 profile:'lady-delilah-forge-profile-v1',
 vault:'lady-delilah-forge-vault-v1',
 run:'lady-delilah-forge-run-v1'
};

const EFFECT_COST={damage:1,armor:.8,heal:1.15,status:3.5,draw:7,energy:8,conditionalDamage:.65,execute:18};
const STATUS_COST={Bleeding:1.5,Flanked:2,Terrified:2.5};
const CARD_BUDGET={0:12,1:20,2:29,3:39,4:48,5:56};
const REWARD_TYPES=new Set(['gold','relic','card','forgeToken','unlock','cosmetic']);

function read(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch{return fallback}}
function write(key,value){localStorage.setItem(key,JSON.stringify(value));return value}
function id(prefix){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}
function clone(value){return JSON.parse(JSON.stringify(value))}

function profile(){return read(KEYS.profile,{schemaVersion:VERSION,permanentTokens:0,tokenHistory:[],rewardHistory:[]})}
function saveProfile(value){return write(KEYS.profile,value)}
function runState(){return read(KEYS.run,{schemaVersion:VERSION,runId:null,runNumber:null,tokens:0,rewards:[]})}
function saveRun(value){return write(KEYS.run,value)}
function vault(){return read(KEYS.vault,{schemaVersion:VERSION,cards:[]})}
function saveVault(value){return write(KEYS.vault,value)}

function beginRun(runNumber){const value={schemaVersion:VERSION,runId:id('run'),runNumber:runNumber??null,tokens:0,rewards:[],startedAt:new Date().toISOString()};return saveRun(value)}
function endRun(){const value=runState();value.endedAt=new Date().toISOString();value.tokens=0;return saveRun(value)}

function awardForgeToken(options={}){
 const token={id:id('forge-token'),scope:options.scope==='run'?'run':'permanent',source:options.source||'unknown',reason:options.reason||'An epic accomplishment',runId:options.runId||runState().runId||null,awardedAt:new Date().toISOString()};
 if(token.scope==='run'){const run=runState();run.tokens+=1;run.rewards.push({type:'forgeToken',token});saveRun(run)}
 else{const p=profile();p.permanentTokens+=1;p.tokenHistory.push({...token,action:'awarded'});saveProfile(p)}
 global.dispatchEvent(new CustomEvent('forge:token-awarded',{detail:clone(token)}));
 return token;
}

function tokenBalance(){const p=profile(),run=runState();return {permanent:p.permanentTokens,run:run.tokens,total:p.permanentTokens+run.tokens}}
function consumeForgeToken(preferRun=true){const p=profile(),run=runState();let scope=null;if(preferRun&&run.tokens>0){run.tokens--;scope='run';saveRun(run)}else if(p.permanentTokens>0){p.permanentTokens--;scope='permanent';p.tokenHistory.push({id:id('forge-token-use'),action:'consumed',scope,consumedAt:new Date().toISOString()});saveProfile(p)}else if(run.tokens>0){run.tokens--;scope='run';saveRun(run)}if(!scope)return null;global.dispatchEvent(new CustomEvent('forge:token-consumed',{detail:{scope}}));return {scope}}

function conditionMultiplier(condition){return condition&&condition!=='none'?0.72:1}
function scoreEffect(effect){const type=effect.type||effect.action;const amount=Math.max(0,Number(effect.amount)||0);let score=(EFFECT_COST[type]??99)*Math.max(1,amount);if(type==='status')score=(STATUS_COST[effect.status]??4)*Math.max(1,amount);if(type==='execute')score=(EFFECT_COST.execute)*(Number(effect.threshold??.25)<=.25?1.1:.9);return score*conditionMultiplier(effect.condition)}
function budgetFor(card){return CARD_BUDGET[Math.min(5,Math.max(0,Number(card.cost)||0))]??CARD_BUDGET[5]}
function evaluateCard(card){
 const effects=card.effects||card.game?.effects||[];
 let spent=effects.reduce((sum,e)=>sum+scoreEffect(e),0);
 if(card.exhaust||card.game?.exhaust)spent*=.78;
 const budget=budgetFor(card);const errors=[];
 if(!card.name?.trim())errors.push('Card needs a name.');
 if(!effects.length)errors.push('Card needs at least one effect.');
 if(effects.length>3)errors.push('Forged cards may have at most three effects.');
 if((Number(card.cost)||0)<0||(Number(card.cost)||0)>5)errors.push('Cost must be between 0 and 5.');
 const ratio=budget?spent/budget:99;
 const verdict=errors.length?'invalid':ratio>1?'over-budget':ratio>.86?'tempered':ratio>.55?'balanced':'under-forged';
 const jonas={invalid:'This is not a weapon yet.','over-budget':'That would break in your hands.',tempered:'Heavy, but it will hold.',balanced:'Now we’re getting somewhere.','under-forged':'You left steel on the table.'}[verdict];
 return {valid:!errors.length&&spent<=budget,verdict,spent:Math.round(spent*10)/10,budget,remaining:Math.round((budget-spent)*10)/10,errors,jonas};
}

function forgeCard(card,metadata={}){
 const evaluation=evaluateCard(card);if(!evaluation.valid)return {ok:false,evaluation};
 const payment=consumeForgeToken(true);if(!payment)return {ok:false,evaluation,error:'No Forge Token available.'};
 const record={...clone(card),id:card.id||id('forged-card'),isForged:true,forge:{version:VERSION,forgedBy:metadata.forgedBy||'Player',forgedDate:new Date().toISOString(),forgedRun:metadata.forgedRun??runState().runNumber??null,forgedRunId:metadata.forgedRunId||runState().runId||null,forgedReason:metadata.forgedReason||'Earned in the hunt',tokenScope:payment.scope,budget:evaluation.budget,spent:evaluation.spent,artworkPool:metadata.artworkPool||card.type||'Unknown',artworkId:metadata.artworkId||null}};
 const data=vault();data.cards.push(record);saveVault(data);global.dispatchEvent(new CustomEvent('forge:card-created',{detail:clone(record)}));return {ok:true,card:record,evaluation};
}

function grantReward(reward,context={}){
 if(!reward||!REWARD_TYPES.has(reward.type))throw new Error('Unsupported reward type.');
 const entry={id:id('reward'),...clone(reward),context:clone(context),grantedAt:new Date().toISOString()};
 if(reward.type==='forgeToken')entry.result=awardForgeToken({scope:reward.scope,source:context.source||reward.source,reason:reward.reason,runId:context.runId});
 const p=profile();p.rewardHistory.push(entry);saveProfile(p);const run=runState();if(run.runId){run.rewards.push(entry);saveRun(run)}global.dispatchEvent(new CustomEvent('forge:reward-granted',{detail:clone(entry)}));return entry;
}

function awardOnce(key,reward,context={}){const p=profile();if(p.rewardHistory.some(x=>x.onceKey===key))return {awarded:false,reason:'already-awarded'};const entry=grantReward({...reward,onceKey:key},context);return {awarded:true,entry}}
function listForgedCards(){return clone(vault().cards)}
function removeForgedCard(){throw new Error('Forged cards are permanent and cannot be deleted through the game API.')}
function snapshot(){return {version:VERSION,tokens:tokenBalance(),run:clone(runState()),vault:listForgedCards(),profile:clone(profile())}}

const api={VERSION,KEYS,beginRun,endRun,awardForgeToken,consumeForgeToken,tokenBalance,evaluateCard,forgeCard,grantReward,awardOnce,listForgedCards,removeForgedCard,snapshot};
Object.freeze(api);global.LadyDelilahForge=api;
})(window);
